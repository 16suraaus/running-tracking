import { Run } from '@/types';
import { Calendar, Clock, Activity, MapPin } from 'lucide-react';

export default function RunCard({ run }: { run: Run }) {
  const dateObj = new Date(run.date);
  // Example: "Mon, Oct 24, 2026"
  const formattedDate = dateObj.toLocaleDateString(undefined, {
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

  return (
    <div className="bg-[#1a1a1a] rounded-2xl p-4 mb-4 shadow-lg border border-gray-800">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center text-gray-400 text-sm font-medium">
          <Calendar size={14} className="mr-1.5" />
          {formattedDate}
        </div>
        <div className="bg-blue-500/10 text-blue-400 text-xs font-bold px-2 py-1 rounded-full flex items-center">
          <Activity size={12} className="mr-1 inline" />
          {paceString}
        </div>
      </div>
      
      <div className="flex divide-x divide-gray-800 mb-3">
        <div className="flex-1 pr-4">
          <div className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">Distance</div>
          <div className="flex items-end">
            <span className="text-3xl font-black text-white leading-none">{run.distance}</span>
            <span className="text-gray-400 font-bold ml-1 mb-0.5">{run.unit}</span>
          </div>
        </div>
        <div className="flex-1 pl-4">
          <div className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">Time</div>
          <div className="flex items-end h-full">
            <div className="flex items-center text-xl font-bold text-gray-200">
              <Clock size={16} className="text-gray-500 mr-1.5" />
              {timeString}
            </div>
          </div>
        </div>
      </div>

      {run.notes && (
        <div className="mt-3 text-sm text-gray-400 bg-[#121212] p-3 rounded-xl border border-gray-800">
          "{run.notes}"
        </div>
      )}
    </div>
  );
}
