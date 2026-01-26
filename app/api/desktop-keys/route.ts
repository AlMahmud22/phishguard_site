import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authMiddleware';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';

/**
 * GET /api/desktop-keys
 * Get all desktop app keys for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    
    await dbConnect();
    
    const user = await User.findById(authUser.id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Return keys without the actual key value (for security)
    const keys = (user.desktopAppKeys || []).map((k: any) => ({
      id: k._id?.toString(),
      name: k.name,
      createdAt: k.createdAt,
      lastUsed: k.lastUsed,
      isActive: k.isActive
    }));
    
    return NextResponse.json({
      success: true,
      data: { keys }
    });
  } catch (error) {
    console.error('Failed to fetch desktop keys:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/desktop-keys
 * Generate a new desktop app key
 */
export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    
    const body = await req.json();
    const { name } = body;
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', message: 'Key name is required' },
        { status: 400 }
      );
    }
    
    await dbConnect();
    
    const user = await User.findById(authUser.id);
    if (activeKeys.length >= 5) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Limit exceeded', 
          message: 'Maximum 5 active desktop keys allowed. Please revoke an existing key first.' 
        },
        { status: 400 }
      );
    }
    
    // Generate unique key: pgd_ prefix + user id prefix + random string
    const randomPart = nanoid(32);
    const plainKey = `pgd_${String(user._id).substring(0, 8)}_${randomPart}`;
    
    // Hash the key for storage (similar to password hashing)
    const hashedKey = await bcrypt.hash(plainKey, 10);
    
    // Add key to user
    user.desktopAppKeys = user.desktopAppKeys || [];
    user.desktopAppKeys.push({
      key: hashedKey,
      name: name.trim(),
      createdAt: new Date(),
      isActive: true
    } as any);
    
    await user.save();
    
    // Send notification email
    const { sendDesktopKeyCreatedEmail } = await import('@/lib/email');
    await sendDesktopKeyCreatedEmail(user.email, user.name, name.trim());
    
    return NextResponse.json({
      success: true,
      data: {
        key: plainKey, // Return plain key ONLY once during creation
        name: name.trim(),
        message: 'Desktop app key created successfully. Save this key securely - it will not be shown again!'
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create desktop key:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/desktop-keys
 * Revoke a desktop app key
 */
export async function DELETE(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    
    const { searchParams } = new URL(req.url);
    const keyId = searchParams.get('id');
    
    if (!keyId) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', message: 'Key ID is required' },
        { status: 400 }
      );
    }
    
    await dbConnect();
    
    const user = await User.findById(authUser.id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Find and deactivate the key
    const key = user.desktopAppKeys?.find((k: any) => k._id?.toString() === keyId);
    if (!key) {
      return NextResponse.json(
        { success: false, error: 'Key not found' },
        { status: 404 }
      );
    }
    
    key.isActive = false;
    await user.save();
    
    return NextResponse.json({
      success: true,
      message: 'Desktop app key revoked successfully'
    });
  } catch (error) {
    console.error('Failed to revoke desktop key:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
