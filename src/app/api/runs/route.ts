import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

import { startOfYear, subDays } from 'date-fns';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '30d';
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    let startDate = new Date(0).toISOString(); // 'all' default
    const now = new Date();
    if (timeframe === '30d') {
      startDate = subDays(now, 30).toISOString();
    } else if (timeframe === 'ytd') {
      startDate = startOfYear(now).toISOString();
    }

    const { rows } = await sql`
      SELECT runs.*, shoes.name as shoe_name, shoes.brand as shoe_brand 
      FROM runs 
      LEFT JOIN shoes ON runs.shoe_id = shoes.id
      WHERE date >= ${startDate} 
      ORDER BY date DESC, runs.id DESC 
      LIMIT ${limit} OFFSET ${offset}
    `;

    return NextResponse.json({ runs: rows }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch runs:", error);
    return NextResponse.json({ error: 'Failed to fetch runs. Ensure you have run /api/setup' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, distance, unit, duration, notes, type, intervals, shoe_id, rpe } = body;
    const runType = type || 'regular';
    const intervalsJSON = intervals ? JSON.stringify(intervals) : null;
    
    if (!date || distance === undefined || !unit || duration === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { rows } = await sql`
      INSERT INTO runs (date, distance, unit, duration, notes, type, intervals, shoe_id, rpe)
      VALUES (${date}, ${distance}, ${unit}, ${duration}, ${notes}, ${runType}, ${intervalsJSON}, ${shoe_id || null}, ${rpe || null})
      RETURNING *;
    `;

    return NextResponse.json({ run: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Failed to insert run:", error);
    return NextResponse.json({ error: 'Failed to insert run' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing run ID' }, { status: 400 });
    }

    await sql`DELETE FROM runs WHERE id = ${id}`;
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("Failed to delete run:", error);
    return NextResponse.json({ error: 'Failed to delete run' }, { status: 500 });
  }
}
