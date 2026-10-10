import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request) {
  try {
    const { photo_id, body, author_name, author_token } = await request.json();

    if (!photo_id || !body || !author_token) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    const name = author_name && author_name.trim() !== '' ? author_name.trim() : 'Anónimo';

    const query = `
      INSERT INTO comments (photo_id, author_token, author_name, body)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const values = [photo_id, author_token, name, body.trim()];
    const result = await pool.query(query, values);

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
