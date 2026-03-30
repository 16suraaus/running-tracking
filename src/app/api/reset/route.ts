import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
export async function GET() {
  await sql`DELETE FROM runs`;
  return NextResponse.json({ success: true });
}
