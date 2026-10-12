import { NextResponse } from 'next/server';

export const config = {
  api: {
    bodyParser: false,
  },
};

function getMimeType(file) {
  if (file.type && file.type !== 'application/octet-stream') {
    return file.type;
  }
  const name = (file.name || '').toLowerCase();
  if (name.endsWith('.mp4')) return 'video/mp4';
  if (name.endsWith('.webm')) return 'video/webm';
  if (name.endsWith('.mov')) return 'video/quicktime';
  if (name.endsWith('.mkv')) return 'video/x-matroska';
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.webp')) return 'image/webp';
  if (name.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}

export async function POST(request) {
  try {
    const data = await request.formData();
    const file = data.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 });
    }

    // Límite de 50MB para base64 en BD
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'El archivo excede el tamaño máximo permitido de 50 MB' },
        { status: 413 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = getMimeType(file);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;

    return NextResponse.json({ url: dataUrl });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

