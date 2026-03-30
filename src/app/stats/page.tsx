import { sql } from '@vercel/postgres';
import { Run } from '@/types';
import StatsDashboard from '@/components/StatsDashboard';

export const dynamic = 'force-dynamic';

export default async function StatsPage() {
  let runs: Run[] = [];
  let errorMsg = null;

  try {
    const { rows } = await sql<Run>`SELECT * FROM runs ORDER BY date DESC, id DESC LIMIT 1000`;
    runs = rows;
  } catch (error: any) {
    if (error?.message?.includes('relation "runs" does not exist')) {
      errorMsg = "Database uninitialized. Please visit /api/setup in your browser first.";
    } else {
      errorMsg = "Database error: Please ensure your Vercel Postgres variables are set in .env.local";
    }
  }

  if (errorMsg) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-black tracking-tight text-white mb-6 mt-4">
          Analysis
        </h1>
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-red-400 text-sm">
          {errorMsg}
        </div>
      </div>
    );
  }

  // We pass data to the Client Component so it can handle interactivity (filtering by date)
  return <StatsDashboard initialRuns={runs} />;
}
