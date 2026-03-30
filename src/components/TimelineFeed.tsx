'use client';

import { useState, useEffect, useCallback } from 'react';
import { Run } from '@/types';
import RunCard from './RunCard';
import { Activity, Loader2, ChevronDown } from 'lucide-react';

export default function TimelineFeed() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [stats, setStats] = useState({ count: 0, distance: 0 });
  const [timeframe, setTimeframe] = useState<'30d' | 'ytd' | 'all'>('30d');
  const [offset, setOffset] = useState(0);
  
  const [loadingRuns, setLoadingRuns] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchSummary = async (tf: string) => {
    try {
      const res = await fetch(`/api/runs/summary?timeframe=${tf}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) { console.error(e) }
  };

  const fetchRuns = async (tf: string, currentOffset: number, isLoadMore = false) => {
    if (!isLoadMore) setLoadingRuns(true);
    else setLoadingMore(true);

    try {
      const res = await fetch(`/api/runs?timeframe=${tf}&limit=10&offset=${currentOffset}`);
      if (res.ok) {
        const data = await res.json();
        if (data.runs.length < 10) setHasMore(false);
        else setHasMore(true);

        if (isLoadMore) setRuns(prev => [...prev, ...data.runs]);
        else setRuns(data.runs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRuns(false);
      setLoadingMore(false);
    }
  };

  // On mount and when timeframe changes
  useEffect(() => {
    setOffset(0);
    setHasMore(true);
    fetchSummary(timeframe);
    fetchRuns(timeframe, 0, false);
  }, [timeframe]);

  const handleLoadMore = () => {
    const nextOffset = offset + 10;
    setOffset(nextOffset);
    fetchRuns(timeframe, nextOffset, true);
  };

  return (
    <>
      <header className="mb-8 mt-4 flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-black tracking-tight text-white">Activity</h1>
            <div className="relative group">
              <select 
                value={timeframe} 
                onChange={(e) => setTimeframe(e.target.value as any)}
                className="appearance-none bg-[#1a1a1a] border border-gray-800 text-xs font-bold text-gray-300 px-3 py-1.5 rounded-full pr-8 cursor-pointer focus:outline-none focus:border-blue-500 transition-colors uppercase tracking-widest"
              >
                <option value="30d">30 DAYS</option>
                <option value="ytd">YTD</option>
                <option value="all">ALL TIME</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
          </div>
          <p className="text-gray-400 font-medium text-sm">
            {stats.count} Runs Logged
          </p>
        </div>
        
        {stats.count > 0 && (
          <div className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-2xl flex flex-col items-end animate-in fade-in zoom-in duration-300">
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">Total Dist</span>
            <div className="font-black text-xl leading-none">
              {stats.distance} <span className="text-xs uppercase ml-0.5">mi</span>
            </div>
          </div>
        )}
      </header>

      {loadingRuns ? (
        <div className="flex justify-center my-12 animate-in fade-in duration-500">
          <Loader2 size={32} className="animate-spin text-blue-500" />
        </div>
      ) : runs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center mt-12 bg-[#121212] rounded-3xl border border-gray-800 border-dashed animate-in zoom-in-95 duration-500">
          <Activity size={48} className="text-gray-700 mb-4" />
          <h3 className="text-xl font-bold text-gray-400 mb-2">No Runs Found</h3>
          <p className="text-gray-600 max-w-[200px] text-sm">Change your timeframe filter or log a new run.</p>
        </div>
      ) : (
        <div className="space-y-4 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {runs.map((run) => (
            <RunCard key={run.id} run={run} />
          ))}
          
          {hasMore && (
            <button 
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="w-full mt-6 bg-[#1a1a1a] hover:bg-[#222] border border-gray-800 text-gray-300 font-bold py-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center"
            >
              {loadingMore ? <Loader2 size={20} className="animate-spin text-blue-500" /> : 'Load Older Runs'}
            </button>
          )}

          {!hasMore && runs.length > 0 && (
            <div className="text-center mt-8 text-xs font-bold uppercase tracking-widest text-gray-600">
              End of activity history
            </div>
          )}
        </div>
      )}
    </>
  );
}
