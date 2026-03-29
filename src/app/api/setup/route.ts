import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await sql`
      CREATE TABLE IF NOT EXISTS runs (
        id SERIAL PRIMARY KEY,
        date VARCHAR(255) NOT NULL,
        distance DECIMAL NOT NULL,
        unit VARCHAR(10) NOT NULL,
        duration INTEGER NOT NULL,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    return NextResponse.json({ result }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
