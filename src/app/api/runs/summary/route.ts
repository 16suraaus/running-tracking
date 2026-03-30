import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { startOfYear, subDays } from 'date-fns';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '30d';

    let startDate = new Date(0).toISOString();
    const now = new Date();
    if (timeframe === '30d') {
      startDate = subDays(now, 30).toISOString();
    } else if (timeframe === 'ytd') {
      startDate = startOfYear(now).toISOString();
    }

    // Mathematically filter out interval distances to keep running logs pure
    const { rows } = await sql`
      SELECT 
        COUNT(*) as total_runs,
        COALESCE(SUM(
          CASE 
            WHEN type = 'interval' THEN 0 
            WHEN unit = 'km' THEN distance * 0.621371 
            ELSE distance 
          END
        ), 0) as total_distance_mi
      FROM runs
      WHERE date >= ${startDate}
    `;

    return NextResponse.json({ 
      count: parseInt(rows[0].total_runs), 
      distance: Number(rows[0].total_distance_mi).toFixed(1)
    }, { status: 200 });

  } catch (error) {
    console.error("Failed to fetch summary:", error);
    return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 });
  }
}
