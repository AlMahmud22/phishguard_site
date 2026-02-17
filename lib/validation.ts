/**
 * Zod validation schemas for API request/response validation
 */
import { z } from 'zod';
import { FILE_UPLOAD } from './constants';

// ===== URL SCANNING SCHEMAS =====

export const ScanRequestSchema = z.object({
  url: z.string()
    .min(1, 'URL is required')
    .max(2048, 'URL too long')
    .refine((url) => {
      try {
        const parsedUrl = url.startsWith('http://') || url.startsWith('https://') 
          ? new URL(url) 
          : new URL(`https://${url}`);
        return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
      } catch {
        return false;
      }
    }, 'Invalid URL format'),
  localResult: z.object({
    score: z.number().min(0).max(100),
    factors: z.array(z.string()).optional(),
  }).optional(),
  localScore: z.number().min(0).max(100).optional(),
  localFactors: z.array(z.string()).optional(),
  context: z.enum(['clipboard', 'manual', 'browser']).optional(),
  userAgent: z.string().max(500).optional(),
});

export const BatchScanRequestSchema = z.object({
  urls: z.array(
    z.union([
      z.string().url('Invalid URL format'),
      z.object({
        url: z.string().url('Invalid URL format'),
        localScore: z.number().min(0).max(100).optional(),
        localFactors: z.array(z.string()).optional(),
      })
    ])
  ).min(1, 'At least one URL is required').max(50, 'Maximum 50 URLs allowed'),
  context: z.enum(['clipboard', 'manual', 'browser']).optional(),
  userAgent: z.string().max(500).optional(),
});

// ===== USER STATS SCHEMA =====

export const StatsQuerySchema = z.object({
  period: z.enum(['today', 'week', 'month', 'year', 'all']).default('all'),
});

// ===== FILE UPLOAD SCHEMA =====

export const FileUploadSchema = z.object({
  version: z.string()
    .min(1, 'Version is required')
    .max(50, 'Version too long')
    .regex(/^\d+\.\d+\.\d+$/, 'Version must be in format X.Y.Z'),
  description: z.string().max(500).optional(),
});

// ===== USER REGISTRATION SCHEMA =====

export const RegisterSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long'),
  email: z.string()
    .email('Invalid email address')
    .toLowerCase(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and number'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// ===== LOGIN SCHEMA =====

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

// ===== PASSWORD RESET SCHEMAS =====

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and number'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// ===== PAGINATION SCHEMA =====

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

// ===== HELPER FUNCTIONS =====

/**
 * Safely parse and validate data with a Zod schema
 * Returns { success: true, data } or { success: false, error }
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string; details?: any } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return {
        success: false,
        error: firstError.message,
        details: error.issues,
      };
    }
    return {
      success: false,
      error: 'Validation failed',
    };
  }
}

/**
 * Parse query parameters with validation
 */
export function parseQuery<T>(
  schema: z.ZodSchema<T>,
  searchParams: URLSearchParams
): { success: true; data: T } | { success: false; error: string } {
  const params = Object.fromEntries(searchParams.entries());
  return validateData(schema, params);
}

// ===== FILE UPLOAD VALIDATION =====

/**
 * Validate PE (Portable Executable) header for Windows .exe files
 * Checks for "MZ" DOS signature and "PE" signature
 */
export function validatePEHeader(buffer: Buffer): boolean {
  try {
    // Check minimum file size (at least 64 bytes for DOS header)
    if (buffer.length < 64) {
      return false;
    }

    // Check DOS signature "MZ" (0x5A4D) at offset 0
    const dosSignature = buffer.readUInt16LE(0);
    if (dosSignature !== FILE_UPLOAD.PE_HEADER.DOS_SIGNATURE) {
      return false;
    }

    // Get PE header offset from offset 0x3C (60)
    const peOffset = buffer.readUInt32LE(FILE_UPLOAD.PE_HEADER.PE_OFFSET_LOCATION);
    
    // Validate PE offset is within file bounds
    if (peOffset > buffer.length - 4) {
      return false;
    }

    // Check PE signature "PE\0\0" (0x4550) at PE offset
    const peSignature = buffer.readUInt16LE(peOffset);
    if (peSignature !== FILE_UPLOAD.PE_HEADER.PE_SIGNATURE) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Validate uploaded file metadata
 */
export function validateFileUpload(file: File, maxSize: number): { valid: boolean; error?: string } {
  // Check file exists
  if (!file || !file.name) {
    return { valid: false, error: 'No file uploaded' };
  }

  // Check file extension
  const hasValidExtension = FILE_UPLOAD.ALLOWED_EXTENSIONS.some(ext => 
    file.name.toLowerCase().endsWith(ext)
  );
  if (!hasValidExtension) {
    return { valid: false, error: `Only ${FILE_UPLOAD.ALLOWED_EXTENSIONS.join(', ')} files are allowed` };
  }

  // Check MIME type
  if (!FILE_UPLOAD.ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid file type' };
  }

  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return { valid: false, error: `File must be smaller than ${maxSizeMB}MB` };
  }

  // Check if file is empty
  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }

  // Check filename length
  if (file.name.length > FILE_UPLOAD.MAX_FILENAME_LENGTH) {
    return { valid: false, error: 'Filename too long' };
  }

  return { valid: true };
}

/**
 * Sanitize version string to prevent directory traversal
 */
export function sanitizeVersion(version: string): string {
  // Remove any path separators and special characters
  return version.replace(/[^a-zA-Z0-9.\-]/g, '').substring(0, 50);
}

/**
 * Sanitize filename to prevent directory traversal and command injection
 */
export function sanitizeFilename(filename: string): string {
  // Remove directory traversal attempts and special characters
  return filename
    .replace(/\.\./g, '')
    .replace(/[/\\]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, FILE_UPLOAD.MAX_FILENAME_LENGTH);
}

export default {
  ScanRequestSchema,
  BatchScanRequestSchema,
  StatsQuerySchema,
  FileUploadSchema,
  RegisterSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  PaginationSchema,
  validateData,
  parseQuery,
  validatePEHeader,
  validateFileUpload,
  sanitizeVersion,
  sanitizeFilename,
};
