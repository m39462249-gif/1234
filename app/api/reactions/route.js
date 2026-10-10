import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request) {
  try {
    const { photo_id, emoji, reactor_token } = await request.json();

    if (!photo_id || !emoji || !reactor_token) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    const query = `
      INSERT INTO reactions (photo_id, emoji, reactor_token)
      VALUES ($1, $2, $3)
      ON CONFLICT (photo_id, emoji, reactor_token) DO NOTHING
      RETURNING *;
    `;
    const values = [photo_id, emoji, reactor_token];
    const result = await pool.query(query, values);

    return NextResponse.json({ success: true, inserted: result.rowCount > 0 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
