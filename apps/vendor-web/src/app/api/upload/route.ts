import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const storageServiceUrl = process.env.STORAGE_SERVICE_URL || 'http://localhost:4005';
    const uploadUrl = `${storageServiceUrl}/api/storage/upload`;

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      // Pass along any necessary headers if needed, but fetch handles multipart boundaries automatically
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Storage service error:', text);
      return NextResponse.json({ error: 'Failed to upload to storage service' }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
