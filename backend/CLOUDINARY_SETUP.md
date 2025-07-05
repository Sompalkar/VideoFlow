# Cloudinary Setup Guide

## Issue Resolution

The HTTP 413 error you're experiencing indicates that the file being uploaded is too large for Cloudinary's limits. Here's how to fix it:

## 1. File Size Limits

- **Free Cloudinary Account**: 100MB maximum file size
- **Paid Cloudinary Account**: Up to 10GB file size

## 2. Environment Variables Setup

Create a `.env` file in the backend directory with your Cloudinary credentials:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_NOTIFICATION_URL=https://your-domain.com/api/cloudinary/webhook
```

## 3. Current Configuration

The system is currently using hardcoded credentials as fallbacks:

- Cloud Name: `sommmmn`
- API Key: `529336143214579`
- API Secret: `IrKFGAzXqOsPDit6XlGDsjJ-H_s`

## 4. Solutions for Large Files

### Option A: Upgrade Cloudinary Plan

- Upgrade to a paid plan for larger file uploads (up to 10GB)
- Visit: https://cloudinary.com/pricing

### Option B: Compress Videos

- Use video compression tools before upload
- Recommended formats: MP4 with H.264 codec
- Target file size: Under 100MB

### Option C: Use Chunked Uploads

The system now supports chunked uploads (6MB chunks) for better handling of large files.

## 5. Error Handling Improvements

The system now provides specific error messages for:

- File too large (413)
- Authentication failures (401)
- Rate limiting (429)
- Invalid file formats (400)

## 6. Testing

After setting up your environment variables:

1. Restart the backend server
2. Try uploading a smaller video file (< 100MB)
3. Check the console logs for detailed error information

## 7. File Size Check

The system now logs file sizes before upload:

```
File size: 45.23 MB
```

If you see files larger than 100MB, they will be rejected with a clear error message.

## 8. Recommended Video Settings

For optimal upload performance:

- Resolution: 720p or 1080p
- Format: MP4
- Codec: H.264
- Bitrate: 2-5 Mbps
- Duration: Keep under 10 minutes for free accounts
