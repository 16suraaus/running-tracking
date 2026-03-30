'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Run, Interval } from '@/types';
import { Calendar, Clock, Activity, Timer, Trash2, Loader2 } from 'lucide-react';

export default function RunCard({ run }: { run: Run }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this run?')) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/runs?id=${run.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.refresh();
      } else {
        alert('Failed to delete run');
        setIsDeleting(false);
      }
    } catch (e) {
      alert('Error deleting run');
      setIsDeleting(false);
    }
  };
  // Use local timezone to prevent dropping a day if submitted at 10pm UTC
  const dObj = new Date(run.date);
  const localDate = new Date(dObj.getTime() + dObj.getTimezoneOffset() * 60000);
  const formattedDate = localDate.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const hours = Math.floor(run.duration / 3600);
  const minutes = Math.floor((run.duration % 3600) / 60);
  const seconds = run.duration % 60;
  
  const timeString = hours > 0 
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const paceSeconds = Math.floor(run.duration / run.distance);
  const paceMinutes = Math.floor(paceSeconds / 60);
  const paceSecondsRem = paceSeconds % 60;
  const paceString = `${paceMinutes}'${paceSecondsRem.toString().padStart(2, '0')}" /${run.unit}`;

  // Group Intervals by their groupId if this is an interval run
  const groupedIntervals: Record<string, Interval[]> = {};
  if (run.type === 'interval' && run.intervals) {
    run.intervals.forEach(interval => {
      const gid = interval.groupId || 'legacy';
      if (!groupedIntervals[gid]) groupedIntervals[gid] = [];
      groupedIntervals[gid].push(interval);
    });
  }

  return (
    <div className="bg-[#1a1a1a] rounded-2xl p-4 mb-4 shadow-lg border border-gray-800 hover:border-blue-500/30 transition-colors">
      <div className="flex justify-between items-center mb-3">
        <div className="flex flex-col">
          <div className="flex items-center text-gray-400 text-[10px] uppercase font-black tracking-widest mb-1">
            <Calendar size={12} className="mr-1.5" />
            {formattedDate}
          </div>
          {run.type === 'interval' && (
            <div className="text-blue-400 text-sm font-black tracking-tight flex items-center mt-0.5 mb-1">
              <Timer size={14} className="mr-1.5" strokeWidth={3} /> INTERVAL WORKOUT
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-blue-500/10 text-blue-400 text-xs font-bold px-2.5 py-1.5 rounded-full flex items-center">
            <Activity size={12} className="mr-1 inline" />
            {run.type === 'interval' ? `Avg: ${paceString}` : paceString}
          </div>
          <button 
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-gray-600 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-500/10 active:scale-95 disabled:opacity-50"
            title="Delete run"
          >
            {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
          </button>
        </div>
      </div>
      
      <div className="flex divide-x divide-gray-800 mb-3 border-y border-gray-800 py-3 mt-2">
        <div className="flex-1 pr-4">
          <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Dist</div>
          <div className="flex items-end">
            <span className="text-3xl font-black text-white leading-none">{Number(Number(run.distance).toFixed(2))}</span>
            <span className="text-gray-400 font-bold ml-1 mb-0.5">{run.unit}</span>
          </div>
        </div>
        <div className="flex-1 pl-4">
          <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Time</div>
          <div className="flex items-end h-[30px]">
            <div className="flex items-center text-xl font-bold text-gray-200">
              <Clock size={16} className="text-gray-500 mr-1.5" />
              {timeString}
            </div>
          </div>
        </div>
      </div>

      {run.type === 'interval' && Object.keys(groupedIntervals).length > 0 && (
        <div className="mt-4 mb-2 space-y-2">
           <div className="text-[10px] font-black tracking-widest text-gray-500 uppercase">Interval Sets</div>
           {Object.values(groupedIntervals).map((group, index) => {
              const reps = group.length;
              const dist = group[0].distance;
              const rest = group[0].rest;
              const restStr = `${Math.floor(rest/60)}:${(rest%60).toString().padStart(2, '0')}`;

              return (
                <div key={index} className="bg-[#121212] p-3 rounded-xl border border-gray-800">
                  <div className="flex items-center justify-between mb-2">
                     <span className="text-sm font-black text-blue-400">{reps} x {dist}m</span>
                     <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{restStr} Rest</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                     {group.map((rep, idx) => {
                       const rm = Math.floor(rep.duration / 60);
                       const rs = (rep.duration % 60).toString().padStart(2, '0');
                       return (
                         <div key={rep.id} className="bg-black/50 border border-gray-800 px-2 py-1 rounded text-xs font-bold text-gray-300">
                           {rm}:{rs}
                         </div>
                       );
                     })}
                  </div>
                </div>
              );
           })}
        </div>
      )}

      {run.notes && (
        <div className="mt-3 text-sm text-gray-400 bg-[#121212] p-3 rounded-xl border border-gray-800 italic">
          "{run.notes}"
        </div>
      )}

      {(run.shoe_name || run.rpe) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {run.rpe && (
            <div className="text-[11px] font-black text-gray-600 uppercase tracking-widest flex items-center bg-[#121212] w-fit px-3 py-1.5 rounded-lg border border-gray-800 shadow-sm">
              <Activity size={12} className="mr-1.5" /> RPE 
              <span className={`ml-2 text-white ${
                run.rpe <= 3 ? 'text-green-400' :
                run.rpe <= 6 ? 'text-yellow-400' :
                run.rpe <= 8 ? 'text-orange-400' :
                'text-red-500'
              }`}>{run.rpe}<span className="text-gray-600">/10</span></span>
            </div>
          )}
          {run.shoe_name && (
            <div className="text-[11px] font-black text-gray-600 uppercase tracking-widest flex items-center bg-[#121212] w-fit px-3 py-1.5 rounded-lg border border-gray-800 shadow-sm">
              👟 <span className="ml-2 text-gray-300">{run.shoe_brand} <span className="text-white">{run.shoe_name}</span></span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
