import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { rows } = await sql`SELECT * FROM runs ORDER BY date DESC, id DESC LIMIT 100`;
    return NextResponse.json({ runs: rows }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch runs:", error);
    return NextResponse.json({ error: 'Failed to fetch runs. Ensure you have run /api/setup' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, distance, unit, duration, notes } = body;
    
    if (!date || distance === undefined || !unit || duration === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { rows } = await sql`
      INSERT INTO runs (date, distance, unit, duration, notes)
      VALUES (${date}, ${distance}, ${unit}, ${duration}, ${notes})
      RETURNING *;
    `;

    return NextResponse.json({ run: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Failed to insert run:", error);
    return NextResponse.json({ error: 'Failed to insert run' }, { status: 500 });
  }
}
