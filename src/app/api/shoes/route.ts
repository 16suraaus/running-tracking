import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { rows } = await sql`
      SELECT 
        shoes.*,
        COALESCE(SUM(
          CASE 
            WHEN runs.unit = 'km' THEN runs.distance * 0.621371 
            ELSE runs.distance 
          END
        ), 0) as total_distance
      FROM shoes
      LEFT JOIN runs ON shoes.id = runs.shoe_id
      WHERE shoes.retired = FALSE
      GROUP BY shoes.id
      ORDER BY shoes.is_default DESC, shoes.created_at DESC;
    `;
    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch shoes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { brand, name, is_default } = await request.json();
    
    if (!brand || !name) {
      return NextResponse.json({ error: 'Brand and Name are required' }, { status: 400 });
    }

    if (is_default) {
      await sql`UPDATE shoes SET is_default = FALSE;`;
    }

    const { rows } = await sql`
      INSERT INTO shoes (brand, name, is_default)
      VALUES (${brand}, ${name}, ${is_default ? true : false})
      RETURNING *;
    `;
    
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add shoe' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, is_default, retired } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Shoe ID required' }, { status: 400 });
    }

    if (is_default) {
      await sql`UPDATE shoes SET is_default = FALSE;`;
      await sql`UPDATE shoes SET is_default = TRUE WHERE id = ${id};`;
    } else if (is_default === false) {
      await sql`UPDATE shoes SET is_default = FALSE WHERE id = ${id};`;
    }

    if (retired !== undefined) {
      await sql`UPDATE shoes SET retired = ${retired} WHERE id = ${id};`;
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update shoe' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Shoe ID required' }, { status: 400 });
    }

    await sql`DELETE FROM shoes WHERE id = ${id};`;
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete shoe' }, { status: 500 });
  }
}
