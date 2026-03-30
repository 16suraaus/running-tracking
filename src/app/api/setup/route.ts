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

    await sql`
      CREATE TABLE IF NOT EXISTS shoes (
        id SERIAL PRIMARY KEY,
        brand VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        is_default BOOLEAN DEFAULT FALSE,
        retired BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const alterType = await sql`ALTER TABLE runs ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'regular';`;
    const alterIntervals = await sql`ALTER TABLE runs ADD COLUMN IF NOT EXISTS intervals JSONB;`;
    const alterShoe = await sql`ALTER TABLE runs ADD COLUMN IF NOT EXISTS shoe_id INTEGER REFERENCES shoes(id) ON DELETE SET NULL;`;
    const alterRPE = await sql`ALTER TABLE runs ADD COLUMN IF NOT EXISTS rpe INTEGER;`;

    return NextResponse.json({ result: 'Success', setup: 'Completed DB Migration' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
