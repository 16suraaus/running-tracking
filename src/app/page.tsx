import { sql } from '@vercel/postgres';
import RunCard from '@/components/RunCard';
import { Run } from '@/types';
import { Activity } from 'lucide-react';

// Force dynamic rendering since data can update frequently
export const dynamic = 'force-dynamic';

export default async function HistoryPage() {
  let runs: Run[] = [];
  let errorMsg = null;

  try {
    const { rows } = await sql<Run>`SELECT * FROM runs ORDER BY date DESC, id DESC LIMIT 100`;
    runs = rows;
  } catch (error: any) {
    if (error?.message?.includes('relation "runs" does not exist')) {
      errorMsg = "Database uninitialized. Please visit /api/setup in your browser first.";
    } else {
      errorMsg = "Database error: Please ensure your Vercel Postgres variables are set in .env.local";
    }
  }

  const totalDistance = runs.reduce((acc, run) => acc + Number(run.distance), 0).toFixed(1);

  return (
    <div className="p-6">
      <header className="mb-8 mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-1">
            Activity
          </h1>
          <p className="text-gray-400 font-medium text-sm">
            {runs.length} Runs Logged
          </p>
        </div>
        
        {runs.length > 0 && (
          <div className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-2xl flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">Total Dist</span>
            <div className="font-black text-xl leading-none">
              {totalDistance} <span className="text-xs uppercase ml-0.5">{runs[0].unit}</span>
            </div>
          </div>
        )}
      </header>

      {errorMsg ? (
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-red-400 text-sm">
          {errorMsg}
        </div>
      ) : runs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center mt-12 bg-[#121212] rounded-3xl border border-gray-800 border-dashed">
          <Activity size={48} className="text-gray-700 mb-4" />
          <h3 className="text-xl font-bold text-gray-400 mb-2">No Runs Yet</h3>
          <p className="text-gray-600 max-w-[200px] text-sm">Hit the Log Run button below to save your first run.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {runs.map((run) => (
            <RunCard key={run.id} run={run} />
          ))}
        </div>
      )}
    </div>
  );
}
