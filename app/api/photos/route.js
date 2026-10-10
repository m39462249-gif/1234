import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const query = `
      SELECT 
        p.id,
        p.url,
        p.caption,
        p.uploader_token,
        p.created_at,
        COALESCE(
          (
            SELECT json_object_agg(r.emoji, r.count)
            FROM (
              SELECT emoji, COUNT(*)::int as count
              FROM reactions
              WHERE photo_id = p.id
              GROUP BY emoji
            ) r
          ), 
          '{}'::json
        ) AS reactions,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', c.id,
                'author_name', c.author_name,
                'body', c.body,
                'created_at', c.created_at
              ) ORDER BY c.created_at ASC
            )
            FROM comments c
            WHERE c.photo_id = p.id
          ),
          '[]'::json
        ) AS comments
      FROM photos p
      ORDER BY p.created_at DESC;
    `;
    const result = await pool.query(query);
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { url, caption, uploader_token } = await request.json();

    if (!url || !uploader_token) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    const query = `
      INSERT INTO photos (url, caption, uploader_token)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const values = [url, caption || '', uploader_token];
    const result = await pool.query(query, values);

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
