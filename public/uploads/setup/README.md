# Setup Files Directory

This directory stores the PhishGuard desktop application setup files uploaded by administrators.

## Purpose
- Stores .exe installation files for PhishGuard desktop app
- Files are uploaded through the Admin Dashboard → Setup Files tab
- Only admin users can upload files
- Public users can download the active setup file from the homepage

## File Naming Convention
Files are automatically named with timestamps:
```
PhishGuard-Setup-[timestamp].exe
```

Example: `PhishGuard-Setup-1737468000000.exe`

## Important Notes
- Only one file is marked as "active" at a time
- Old files are kept in the database but marked inactive
- Each download increments the download counter
- Files should be scanned for viruses before upload
- Recommended max file size: 100MB

## Security
- Files are served through Next.js API routes
- Download tracking is enabled
- Only .exe files are accepted
- Admin authentication required for upload
- No authentication required for download (public access)

## Maintenance
- Periodically clean up old inactive files
- Monitor disk space usage
- Backup important versions
- Check file integrity regularly
