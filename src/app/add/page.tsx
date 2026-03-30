'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Plus, Trash2, ChevronDown, ChevronUp, Activity } from 'lucide-react';
import { Interval, Shoe } from '@/types';

export default function AddRunPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [runType, setRunType] = useState<'regular' | 'interval'>('regular');
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    distance: '',
    unit: 'mi',
    hours: '0',
    minutes: '0',
    seconds: '0',
    paceMinutes: '',
    paceSeconds: '',
    notes: '',
    shoe_id: '',
    rpe: null as number | null
  });

  const [showDetails, setShowDetails] = useState(false);

  const [shoes, setShoes] = useState<Shoe[]>([]);

  useEffect(() => {
    fetch('/api/shoes')
      .then(res => res.json())
      .then((data: Shoe[]) => {
        setShoes(data);
        const defaultShoe = data.find(s => s.is_default);
        if (defaultShoe) {
          setFormData(prev => ({ ...prev, shoe_id: defaultShoe.id.toString() }));
        }
      })
      .catch(err => console.error('Failed to load shoes', err));
  }, []);

  // Interval Builder State
  const [blockReps, setBlockReps] = useState('1');
  const [blockDist, setBlockDist] = useState('');
  const [blockRestMins, setBlockRestMins] = useState('1');
  const [blockRestSecs, setBlockRestSecs] = useState('0');

  const [repRows, setRepRows] = useState<{id: string, groupId: string, distance: number, timeMins: string, timeSecs: string, restSecs: number}[]>([]);

  const handleDistanceBlur = () => {
    const totalSecs = (parseInt(formData.hours||'0')*3600) + (parseInt(formData.minutes||'0')*60) + parseInt(formData.seconds||'0');
    const dist = parseFloat(formData.distance);
    const paceS = (parseInt(formData.paceMinutes||'0')*60) + parseInt(formData.paceSeconds||'0');

    if (dist > 0 && totalSecs > 0) {
      const p = Math.floor(totalSecs / dist);
      setFormData(prev => ({ ...prev, paceMinutes: Math.floor(p/60).toString(), paceSeconds: (p%60).toString()}));
    } else if (dist > 0 && paceS > 0 && totalSecs === 0) {
      const tSecs = Math.floor(dist * paceS);
      setFormData(prev => ({
        ...prev, hours: Math.floor(tSecs/3600).toString(), minutes: Math.floor((tSecs%3600)/60).toString(), seconds: (tSecs%60).toString()
      }));
    }
  };

  const handleTimeBlur = () => {
    const totalSecs = (parseInt(formData.hours||'0')*3600) + (parseInt(formData.minutes||'0')*60) + parseInt(formData.seconds||'0');
    const dist = parseFloat(formData.distance);
    const paceS = (parseInt(formData.paceMinutes||'0')*60) + parseInt(formData.paceSeconds||'0');

    if (totalSecs > 0 && dist > 0) {
      const p = Math.floor(totalSecs / dist);
      setFormData(prev => ({ ...prev, paceMinutes: Math.floor(p/60).toString(), paceSeconds: (p%60).toString()}));
    } else if (totalSecs > 0 && paceS > 0 && !dist) {
      setFormData(prev => ({ ...prev, distance: (totalSecs / paceS).toFixed(2) }));
    }
  };

  const handlePaceBlur = () => {
    const totalSecs = (parseInt(formData.hours||'0')*3600) + (parseInt(formData.minutes||'0')*60) + parseInt(formData.seconds||'0');
    const dist = parseFloat(formData.distance);
    const paceS = (parseInt(formData.paceMinutes||'0')*60) + parseInt(formData.paceSeconds||'0');

    if (paceS > 0 && dist > 0) {
      const tSecs = Math.floor(dist * paceS);
      setFormData(prev => ({
        ...prev, hours: Math.floor(tSecs/3600).toString(), minutes: Math.floor((tSecs%3600)/60).toString(), seconds: (tSecs%60).toString()
      }));
    } else if (paceS > 0 && totalSecs > 0 && !dist) {
      setFormData(prev => ({ ...prev, distance: (totalSecs / paceS).toFixed(2) }));
    }
  };

  const handleAddBlock = (e: React.MouseEvent) => {
    e.preventDefault();
    const r = parseInt(blockReps||'1');
    const d = parseInt(blockDist);
    if (!d || d <= 0) return;
    const rm = parseInt(blockRestMins||'0');
    const rs = parseInt(blockRestSecs||'0');
    const totalRest = rm * 60 + rs;
    const groupId = Math.random().toString(36).substring(7);

    const newRows = [];
    for(let i=0; i<r; i++) {
       newRows.push({
         id: Math.random().toString(36).substring(7),
         groupId,
         distance: d,
         timeMins: '',
         timeSecs: '',
         restSecs: totalRest
       });
    }
    setRepRows([...repRows, ...newRows]);
    setBlockDist('');
  };

  const removeRep = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setRepRows(repRows.filter(r => r.id !== id));
  };

  const updateRep = (id: string, field: string, val: string) => {
    setRepRows(repRows.map(r => r.id === id ? { ...r, [field]: val } : r));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    let durationSeconds = 
      (parseInt(formData.hours || '0') * 3600) +
      (parseInt(formData.minutes || '0') * 60) +
      parseInt(formData.seconds || '0');

    let finalDistance = parseFloat(formData.distance) || 0;

    if (runType === 'regular' && durationSeconds <= 0) {
      setErrorMsg('Please enter a valid time');
      setLoading(false);
      return;
    }

    if (runType === 'regular' && finalDistance <= 0) {
      setErrorMsg('Please enter a valid total distance');
      setLoading(false);
      return;
    }

    // Format intervals if applied
    let formattedIntervals: Interval[] | null = null;
    if (runType === 'interval') {
      if (repRows.length === 0) {
        setErrorMsg('Please add at least one interval rep');
        setLoading(false);
        return;
      }
      
      let totalMeters = 0;
      let totalSecs = 0;

      formattedIntervals = repRows.map(r => {
        const dSecs = (parseInt(r.timeMins||'0') * 60) + parseInt(r.timeSecs||'0');
        totalMeters += r.distance;
        totalSecs += dSecs + r.restSecs; // Total interval span includes rest
        return {
          id: r.id,
          groupId: r.groupId,
          distance: r.distance,
          unit: 'm',
          duration: dSecs,
          rest: r.restSecs
        };
      });

      // Auto-calculate DB requirements under the hood and safely truncate to 2 decimals
      finalDistance = Number((totalMeters * 0.000621371).toFixed(2)); // Convert meters to miles
      durationSeconds = totalSecs;
    }

    try {
      const response = await fetch('/api/runs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: formData.date,
          distance: finalDistance,
          unit: runType === 'interval' ? 'mi' : formData.unit,
          duration: durationSeconds,
          notes: formData.notes,
          type: runType,
          intervals: formattedIntervals,
          shoe_id: formData.shoe_id ? parseInt(formData.shoe_id) : null,
          rpe: formData.rpe
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save run. Make sure your database is connected.');
      }

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value === '0') {
      e.target.value = '';
    }
  };

  return (
    <div className="p-6">
      <header className="mb-6 mt-4 flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tight text-white mb-1">
          Log a Run
        </h1>
      </header>

      {/* Type Toggle */}
      <div className="flex bg-[#1a1a1a] rounded-full p-1 mb-6 border border-gray-800">
        {(['regular', 'interval'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setRunType(type)}
            className={`flex-1 text-xs font-bold uppercase tracking-wider py-3 rounded-full transition-all ${
              runType === type 
                ? 'bg-blue-500 text-black shadow-lg shadow-blue-500/20' 
                : 'text-gray-500 hover:text-white'
            }`}
          >
            {type === 'regular' ? 'Standard Run' : 'Interval Workout'}
          </button>
        ))}
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-400 uppercase tracking-wider ml-1">Date</label>
          <input 
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
            className="w-full bg-[#1a1a1a] text-white border border-gray-800 rounded-2xl px-4 py-4 text-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium appearance-none"
            required
          />
        </div>

        {/* Shoe Worn block removed from here */}
        {runType === 'regular' && (
          <>
            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-wider ml-1">Total Distance</label>
                <div className="flex gap-2">
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.distance}
                    onBlur={handleDistanceBlur}
                    onChange={(e) => setFormData({...formData, distance: e.target.value})}
                    placeholder="0.00"
                    className="w-full bg-[#1a1a1a] text-white border border-gray-800 rounded-2xl px-3 py-4 text-xl font-black focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-700"
                    required
                  />
                  <select 
                    value={formData.unit}
                    onChange={(e) => {
                      setFormData({...formData, unit: e.target.value});
                      setTimeout(handleDistanceBlur, 100);
                    }}
                    className="bg-[#1a1a1a] text-blue-400 border border-gray-800 rounded-2xl px-2 py-4 text-sm font-bold focus:outline-none focus:border-blue-500 appearance-none text-center min-w-[50px]"
                  >
                    <option value="mi">mi</option>
                    <option value="km">km</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-wider ml-1">Pace</label>
                <div className="flex gap-1">
                  <div className="flex-1 relative">
                    <input 
                      type="number"
                      min="0"
                      value={formData.paceMinutes}
                      onFocus={handleFocus}
                      onBlur={handlePaceBlur}
                      onChange={(e) => setFormData({...formData, paceMinutes: e.target.value})}
                      className="w-full bg-[#1a1a1a] text-center text-white border border-gray-800 rounded-2xl px-1 py-4 text-xl font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                    <span className="absolute bottom-0 w-full text-center text-[9px] text-gray-500 font-black uppercase tracking-widest leading-none pb-1.5">Min</span>
                  </div>
                  <div className="flex flex-col justify-center text-xl font-black text-gray-600 pb-3">:</div>
                  <div className="flex-1 relative">
                    <input 
                      type="number"
                      min="0"
                      max="59"
                      value={formData.paceSeconds}
                      onFocus={handleFocus}
                      onBlur={handlePaceBlur}
                      onChange={(e) => setFormData({...formData, paceSeconds: e.target.value})}
                      className="w-full bg-[#1a1a1a] text-center text-white border border-gray-800 rounded-2xl px-1 py-4 text-xl font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                    <span className="absolute bottom-0 w-full text-center text-[9px] text-gray-500 font-black uppercase tracking-widest leading-none pb-1.5">Sec</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-sm font-bold text-gray-400 uppercase tracking-wider ml-1">Total Time</label>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input 
                    type="number"
                    min="0"
                    value={formData.hours}
                    onFocus={handleFocus}
                    onBlur={handleTimeBlur}
                    onChange={(e) => setFormData({...formData, hours: e.target.value})}
                    className="w-full bg-[#1a1a1a] text-center text-white border border-gray-800 rounded-2xl px-2 py-4 text-xl font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                  <span className="absolute bottom-1 w-full text-center text-[10px] text-gray-500 font-black uppercase tracking-widest">Hrs</span>
                </div>
                <div className="flex flex-col justify-center text-xl font-black text-gray-600 pb-3">:</div>
                <div className="flex-1 relative">
                  <input 
                    type="number"
                    min="0"
                    max="59"
                    value={formData.minutes}
                    onFocus={handleFocus}
                    onBlur={handleTimeBlur}
                    onChange={(e) => setFormData({...formData, minutes: e.target.value})}
                    className="w-full bg-[#1a1a1a] text-center text-white border border-gray-800 rounded-2xl px-2 py-4 text-xl font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                  <span className="absolute bottom-1 w-full text-center text-[10px] text-gray-500 font-black uppercase tracking-widest">Min</span>
                </div>
                <div className="flex flex-col justify-center text-xl font-black text-gray-600 pb-3">:</div>
                <div className="flex-1 relative">
                  <input 
                    type="number"
                    min="0"
                    max="59"
                    value={formData.seconds}
                    onFocus={handleFocus}
                    onBlur={handleTimeBlur}
                    onChange={(e) => setFormData({...formData, seconds: e.target.value})}
                    className="w-full bg-[#1a1a1a] text-center text-white border border-gray-800 rounded-2xl px-2 py-4 text-xl font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                  <span className="absolute bottom-1 w-full text-center text-[10px] text-gray-500 font-black uppercase tracking-widest">Sec</span>
                </div>
              </div>
            </div>
          </>
        )}

        {runType === 'interval' && (
          <div className="pt-2 space-y-4 animate-in fade-in slide-in-from-top-2">
            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider ml-1 border-t border-gray-800 pt-6">Interval Builder</h3>
            
            {/* Block Builder Input */}
            <div className="bg-[#121212] p-4 rounded-2xl border border-gray-800 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase ml-1">Reps</span>
                  <input type="number" min="1" value={blockReps} onChange={e=>setBlockReps(e.target.value)} className="w-full bg-[#1a1a1a] text-white border border-gray-800 rounded-xl px-2 py-2 text-center focus:outline-none focus:border-blue-500"/>
                </div>
                <div className="text-gray-600 font-black mt-4">x</div>
                <div className="flex-[2]">
                  <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase ml-1">Distance (m)</span>
                  <input type="number" min="1" placeholder="400" value={blockDist} onChange={e=>setBlockDist(e.target.value)} className="w-full bg-[#1a1a1a] text-white border border-gray-800 rounded-xl px-2 py-2 text-center focus:outline-none focus:border-blue-500"/>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <span className="text-xs font-black tracking-widest text-gray-500 uppercase whitespace-nowrap pt-1">Rest</span>
                 <div className="flex items-center gap-1 flex-1">
                    <input type="number" min="0" value={blockRestMins} onChange={e=>setBlockRestMins(e.target.value)} className="w-full bg-[#1a1a1a] text-white border border-gray-800 rounded-xl px-1 py-1 text-center focus:outline-none focus:border-blue-500"/>
                    <span className="text-gray-500 font-black">:</span>
                    <input type="number" min="0" max="59" value={blockRestSecs} onChange={e=>setBlockRestSecs(e.target.value)} className="w-full bg-[#1a1a1a] text-white border border-gray-800 rounded-xl px-1 py-1 text-center focus:outline-none focus:border-blue-500"/>
                 </div>
                 <button onClick={handleAddBlock} className="bg-blue-500 text-black p-2 rounded-xl active:scale-95 ml-2"><Plus size={18} strokeWidth={3}/></button>
              </div>
            </div>

            {/* Rep List */}
            {repRows.length > 0 && (
              <div className="space-y-2 mt-4">
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2">Track your splits</div>
                {repRows.map((rep, idx) => (
                  <div key={rep.id} className="flex items-center gap-3 bg-[#1a1a1a] border border-gray-800 p-3 rounded-2xl">
                    <div className="w-8 text-center text-xl font-black text-gray-700">{idx+1}</div>
                    <div className="flex flex-col flex-1">
                      <span className="text-sm font-bold text-white mb-1">{rep.distance}m</span>
                      <span className="text-[10px] text-gray-500 font-black uppercase">{Math.floor(rep.restSecs/60)}:{(rep.restSecs%60).toString().padStart(2, '0')} Rest</span>
                    </div>
                    <div className="flex items-center gap-1 w-28">
                      <input type="number" placeholder="00" min="0" value={rep.timeMins} onChange={e=>updateRep(rep.id, 'timeMins', e.target.value)} className="w-full bg-black/50 text-white border border-gray-800 rounded-lg px-1 py-2 text-center text-lg font-bold focus:outline-none focus:border-blue-500"/>
                      <span className="text-gray-500 font-black">:</span>
                      <input type="number" placeholder="00" min="0" max="59" value={rep.timeSecs} onChange={e=>updateRep(rep.id, 'timeSecs', e.target.value)} className="w-full bg-black/50 text-white border border-gray-800 rounded-lg px-1 py-2 text-center text-lg font-bold focus:outline-none focus:border-blue-500"/>
                    </div>
                    <button onClick={(e) => removeRep(rep.id, e)} className="text-red-500/50 hover:text-red-500 p-2"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="pt-2 border-t border-gray-800/50 mt-4">
          <button 
            type="button" 
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-between w-full py-4 px-2 text-gray-400 hover:text-white transition-colors"
          >
            <span className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <Activity size={16} /> Additional Details {formData.rpe || formData.notes || formData.shoe_id ? '(Active)' : ''}
            </span>
            {showDetails ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {showDetails && (
            <div className="space-y-6 pt-2 pb-4 animate-in fade-in slide-in-from-top-2 duration-300">
              {/* RPE Selector */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-wider ml-1">Perceived Exertion (RPE)</label>
                <div className="flex justify-between gap-1 overflow-x-auto pb-2 no-scrollbar">
                  {[1,2,3,4,5,6,7,8,9,10].map(val => {
                    const isSelected = formData.rpe === val;
                    let colorClass = 'bg-[#1a1a1a] text-gray-500 hover:border-gray-600';
                    if (isSelected) {
                      if (val <= 3) colorClass = 'bg-green-500/20 text-green-400 border-green-500/50 shadow-lg shadow-green-500/10';
                      else if (val <= 6) colorClass = 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50 shadow-lg shadow-yellow-500/10';
                      else if (val <= 8) colorClass = 'bg-orange-500/20 text-orange-400 border-orange-500/50 shadow-lg shadow-orange-500/10';
                      else colorClass = 'bg-red-500/20 text-red-500 border-red-500/50 shadow-lg shadow-red-500/10';
                    }
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setFormData({...formData, rpe: isSelected ? null : val})}
                        className={`min-w-10 h-12 rounded-xl flex items-center justify-center font-black text-lg border border-gray-800 transition-all ${colorClass}`}
                      >
                        {val}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Shoe Selection */}
              {shoes.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-wider ml-1">Gear</label>
                  <select
                    value={formData.shoe_id}
                    onChange={(e) => setFormData({...formData, shoe_id: e.target.value})}
                    className="w-full bg-[#1a1a1a] text-white border border-gray-800 rounded-2xl px-4 py-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium appearance-none"
                  >
                    <option value="">None specified</option>
                    {shoes.map(shoe => (
                      <option key={shoe.id} value={shoe.id}>
                        {shoe.brand} {shoe.name} {shoe.is_default ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-wider ml-1">Notes</label>
                <textarea 
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="How did it feel?"
                  rows={2}
                  className="w-full bg-[#1a1a1a] text-white border border-gray-800 rounded-2xl px-4 py-4 text-base focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-700 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-400 text-black font-black text-lg py-5 rounded-2xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center mt-6 active:scale-[0.98]"
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save size={20} className="mb-0.5" /> Save Run
            </span>
          )}
        </button>
      </form>
    </div>
  );
}
