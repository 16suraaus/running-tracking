'use client';

import { useState, useMemo } from 'react';
import { Run } from '@/types';
import { subDays, startOfYear, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Route, Clock, Hash, Calendar, FileSpreadsheet } from 'lucide-react';

type Timeframe = '7d' | '30d' | 'ytd' | 'custom' | 'all';

export default function StatsDashboard({ initialRuns }: { initialRuns: Run[] }) {
  const [timeframe, setTimeframe] = useState<Timeframe>('30d');
  
  // Custom date range state
  const [customStart, setCustomStart] = useState<string>(subDays(new Date(), 7).toISOString().split('T')[0]);
  const [customEnd, setCustomEnd] = useState<string>(new Date().toISOString().split('T')[0]);

  const handleExport = (type: 'steady' | 'interval') => {
    let csvContent = '';
    let filename = '';

    if (type === 'steady') {
      const steadyRuns = initialRuns.filter(r => r.type === 'regular' || !r.type);
      csvContent = 'Date,Distance,Unit,Duration_Seconds,Pace_Seconds,Notes\n';
      steadyRuns.forEach(r => {
        const paceSecs = Math.floor(r.duration / r.distance);
        const safeNotes = r.notes ? `"${r.notes.replace(/"/g, '""')}"` : '';
        csvContent += `${r.date},${Number(Number(r.distance).toFixed(2))},${r.unit},${r.duration},${paceSecs},${safeNotes}\n`;
      });
      filename = 'steady_state_runs.csv';

    } else if (type === 'interval') {
      const intervalRuns = initialRuns.filter(r => r.type === 'interval');
      csvContent = 'Workout_ID,Date,Rep_Number,Distance_m,Duration_Seconds,Rest_Given_Seconds\n';
      
      intervalRuns.forEach(r => {
        if (!r.intervals) return;
        r.intervals.forEach((rep, idx) => {
          csvContent += `${r.id},${r.date},${idx + 1},${rep.distance},${rep.duration},${rep.rest}\n`;
        });
      });
      filename = 'interval_splits.csv';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const file = new File([blob], filename, { type: 'text/csv' });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({
        title: 'Running Tracker Export',
        files: [file],
      }).catch((err) => console.log('Share canceled', err));
    } else {
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  // Filter runs based on timeframe
  const filteredRuns = useMemo(() => {
    const now = new Date();
    return initialRuns.filter(run => {
      // Exclude interval runs to keep aggregate standard pacing/distance metrics pure
      if (run.type === 'interval') return false;

      const runDate = new Date(run.date);
      // We parse strings as local dates to avoid timezone shift dropping them a day
      const localRunDate = new Date(runDate.getTime() + runDate.getTimezoneOffset() * 60000);

      switch (timeframe) {
        case '7d': return isAfter(localRunDate, subDays(now, 7));
        case '30d': return isAfter(localRunDate, subDays(now, 30));
        case 'ytd': return isAfter(localRunDate, startOfYear(now));
        case 'custom': 
          if (!customStart || !customEnd) return true;
          const start = startOfDay(new Date(customStart + 'T00:00:00'));
          const end = endOfDay(new Date(customEnd + 'T23:59:59'));
          return (isAfter(localRunDate, start) || localRunDate.getTime() === start.getTime()) && 
                 (isBefore(localRunDate, end) || localRunDate.getTime() === end.getTime());
        default: return true;
      }
    });
  }, [initialRuns, timeframe, customStart, customEnd]);

  // Aggregate stats
  const stats = useMemo(() => {
    let totalDistanceStr = 0;
    let totalSeconds = 0;
    
    filteredRuns.forEach(run => {
      const distanceInMi = run.unit === 'km' ? Number(run.distance) * 0.621371 : Number(run.distance);
      totalDistanceStr += distanceInMi;
      totalSeconds += run.duration;
    });

    const runCount = filteredRuns.length;
    
    let avgPaceStr = '--';
    if (totalDistanceStr > 0) {
      const paceSeconds = Math.floor(totalSeconds / totalDistanceStr);
      const paceMinutes = Math.floor(paceSeconds / 60);
      const paceSecondsRem = paceSeconds % 60;
      avgPaceStr = `${paceMinutes}'${paceSecondsRem.toString().padStart(2, '0')}"`;
    }

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    return {
      distance: totalDistanceStr.toFixed(1),
      count: runCount,
      time: timeStr,
      pace: avgPaceStr,
    };
  }, [filteredRuns]);

  // Chart Data preparation (group by date)
  const chartData = useMemo(() => {
    const grouped = filteredRuns.reduce((acc, run) => {
      const runDate = new Date(run.date);
      const localRunDate = new Date(runDate.getTime() + runDate.getTimezoneOffset() * 60000);
      const dateParts = localRunDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const distanceInMi = run.unit === 'km' ? Number(run.distance) * 0.621371 : Number(run.distance);
      
      if (!acc[dateParts]) acc[dateParts] = 0;
      acc[dateParts] += distanceInMi;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([date, distance]) => ({ date, distance: Number(distance.toFixed(2)) }))
      .reverse();
  }, [filteredRuns]);

  return (
    <div className="p-6">
      <header className="mb-6 mt-4 flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tight text-white mb-1">
          Analysis
        </h1>
      </header>
      
      {/* Timeframe selector */}
      <div className="flex bg-[#1a1a1a] rounded-full p-1 mb-4 border border-gray-800 overflow-x-auto no-scrollbar">
        {(['7d', '30d', 'ytd', 'all', 'custom'] as Timeframe[]).map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`flex-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider py-2.5 px-3 rounded-full transition-all whitespace-nowrap ${
              timeframe === tf 
                ? 'bg-blue-500 text-black shadow-lg shadow-blue-500/20' 
                : 'text-gray-500 hover:text-white'
            }`}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Custom Date Filters */}
      {timeframe === 'custom' && (
        <div className="flex items-center gap-2 mb-6 bg-[#1a1a1a] p-3 rounded-2xl border border-gray-800 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex-1 flex flex-col">
            <span className="text-[9px] text-gray-500 uppercase tracking-widest font-black ml-1 mb-1">Start</span>
            <div className="relative">
              <input 
                type="date" 
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full bg-[#121212] text-sm text-gray-200 border border-gray-800 rounded-xl px-2 py-2 focus:outline-none focus:border-blue-500 transition-all cursor-pointer font-medium appearance-none"
              />
            </div>
          </div>
          <div className="text-gray-600 font-bold mb-[-12px]">-</div>
          <div className="flex-1 flex flex-col">
            <span className="text-[9px] text-gray-500 uppercase tracking-widest font-black ml-1 mb-1">End</span>
            <div className="relative">
              <input 
                type="date" 
                value={customEnd}
                min={customStart}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full bg-[#121212] text-sm text-gray-200 border border-gray-800 rounded-xl px-2 py-2 focus:outline-none focus:border-blue-500 transition-all cursor-pointer font-medium appearance-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Aggregate Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-[#1a1a1a] border border-gray-800 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
          <Route size={18} className="text-blue-500 mb-2" />
          <div className="text-3xl font-black text-white">{stats.distance} <span className="text-sm font-bold text-gray-500 uppercase">mi</span></div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Distance</div>
        </div>
        <div className="bg-[#1a1a1a] border border-gray-800 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
          <Activity size={18} className="text-blue-500 mb-2" />
          <div className="text-2xl font-black text-white">{stats.pace}</div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Avg Pace</div>
        </div>
        <div className="bg-[#1a1a1a] border border-gray-800 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
          <Clock size={18} className="text-blue-500 mb-2" />
          <div className="text-2xl font-black text-white">{stats.time}</div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Duration</div>
        </div>
        <div className="bg-[#1a1a1a] border border-gray-800 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
          <Hash size={18} className="text-blue-500 mb-2" />
          <div className="text-3xl font-black text-white">{stats.count}</div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Runs</div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-3xl p-5 shadow-lg mb-6">
        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-6 px-1">Distance Over Time</h3>
        <div className="h-48 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 700 }}
                  dy={10}
                />
                <Tooltip 
                  cursor={{ fill: '#262626', radius: 8 }}
                  contentStyle={{ backgroundColor: '#121212', borderRadius: '12px', borderColor: '#374151', color: '#fff', fontWeight: 'bold' }}
                  itemStyle={{ color: '#3b82f6', fontWeight: 900 }}
                  formatter={(value: any) => [`${value} mi`, 'Distance']}
                />
                <Bar 
                  dataKey="distance" 
                  fill="#3b82f6" 
                  radius={[4, 4, 4, 4]} 
                  barSize={20}
                  label={{ position: 'top', fill: '#9ca3af', fontSize: 10, fontWeight: 700, formatter: (val: any) => `${val}mi` }}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full w-full flex items-center justify-center text-gray-600 text-sm font-medium">
               No runs in this timeframe.
             </div>
          )}
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-3xl p-5 shadow-lg mb-20">
        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-4 px-1 flex items-center">
          <FileSpreadsheet size={16} className="mr-2 text-blue-500" /> Export Data
        </h3>
        <div className="grid grid-cols-1 gap-3">
          <button onClick={() => handleExport('steady')} className="bg-[#121212] hover:bg-black text-gray-300 border border-gray-800 p-4 rounded-2xl flex flex-col transition-all active:scale-[0.98]">
            <span className="font-bold text-sm text-white mb-1">Steady-State History</span>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Run-Level CSV</span>
          </button>
          <button onClick={() => handleExport('interval')} className="bg-[#121212] hover:bg-black text-blue-400 border border-blue-900/30 p-4 rounded-2xl flex flex-col transition-all active:scale-[0.98]">
            <span className="font-bold text-sm mb-1">Interval Splits</span>
            <span className="text-[10px] text-blue-500/50 font-bold uppercase tracking-widest">Rep-Level CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
}
