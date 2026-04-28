import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import cloudinary from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ statusCode: 401, message: 'Unauthorized' }, { status: 401 });
    await adminAuth.verifyIdToken(token);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ statusCode: 400, message: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = buffer.toString('base64');
    const fileUri = `data:${file.type};base64,${base64Data}`;
    
    const folder = formData.get('folder') as string || 'cineme/general';
    
    const result = await cloudinary.uploader.upload(fileUri, {
      folder: folder,
      resource_type: 'auto'
    });

    return NextResponse.json({ statusCode: 200, message: 'Success', url: result.secure_url });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ statusCode: 500, message: error.message || 'Internal error' }, { status: 500 });
  }
}
