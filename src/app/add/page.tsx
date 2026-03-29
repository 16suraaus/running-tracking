'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function AddRunPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    distance: '',
    unit: 'mi',
    hours: '0',
    minutes: '0',
    seconds: '0',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const durationSeconds = 
      (parseInt(formData.hours || '0') * 3600) +
      (parseInt(formData.minutes || '0') * 60) +
      parseInt(formData.seconds || '0');

    if (durationSeconds <= 0) {
      setErrorMsg('Please enter a valid time');
      setLoading(false);
      return;
    }

    if (!formData.distance || parseFloat(formData.distance) <= 0) {
      setErrorMsg('Please enter a valid distance');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/runs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: formData.date,
          distance: parseFloat(formData.distance),
          unit: formData.unit,
          duration: durationSeconds,
          notes: formData.notes
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save run. Make sure your database is connected.');
      }

      router.push('/');
      router.refresh(); // Refresh the server component data on the home page
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
      <header className="mb-8 mt-4 flex items-center">
        <h1 className="text-3xl font-black tracking-tight text-white mb-1">
          Log a Run
        </h1>
      </header>

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

        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-400 uppercase tracking-wider ml-1">Distance</label>
          <div className="flex gap-3">
            <input 
              type="number"
              step="0.01"
              min="0"
              value={formData.distance}
              onChange={(e) => setFormData({...formData, distance: e.target.value})}
              placeholder="0.00"
              className="flex-1 bg-[#1a1a1a] text-white border border-gray-800 rounded-2xl px-4 py-4 text-2xl font-black focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-700"
              required
            />
            <select 
              value={formData.unit}
              onChange={(e) => setFormData({...formData, unit: e.target.value})}
              className="bg-[#1a1a1a] text-blue-400 border border-gray-800 rounded-2xl px-4 py-4 text-lg font-bold focus:outline-none focus:border-blue-500 appearance-none min-w-[90px] text-center"
            >
              <option value="mi">mi</option>
              <option value="km">km</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-400 uppercase tracking-wider ml-1">Time</label>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input 
                type="number"
                min="0"
                value={formData.hours}
                onFocus={handleFocus}
                onChange={(e) => setFormData({...formData, hours: e.target.value})}
                className="w-full bg-[#1a1a1a] text-center text-white border border-gray-800 rounded-2xl px-2 py-4 text-xl font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
              <span className="absolute bottom-1 w-full text-center text-[10px] text-gray-500 uppercase font-black uppercase tracking-widest">Hrs</span>
            </div>
            <div className="flex flex-col justify-center text-xl font-black text-gray-600 pb-3">:</div>
            <div className="flex-1 relative">
              <input 
                type="number"
                min="0"
                max="59"
                value={formData.minutes}
                onFocus={handleFocus}
                onChange={(e) => setFormData({...formData, minutes: e.target.value})}
                className="w-full bg-[#1a1a1a] text-center text-white border border-gray-800 rounded-2xl px-2 py-4 text-xl font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
              <span className="absolute bottom-1 w-full text-center text-[10px] text-gray-500 uppercase font-black uppercase tracking-widest">Min</span>
            </div>
            <div className="flex flex-col justify-center text-xl font-black text-gray-600 pb-3">:</div>
            <div className="flex-1 relative">
              <input 
                type="number"
                min="0"
                max="59"
                value={formData.seconds}
                onFocus={handleFocus}
                onChange={(e) => setFormData({...formData, seconds: e.target.value})}
                className="w-full bg-[#1a1a1a] text-center text-white border border-gray-800 rounded-2xl px-2 py-4 text-xl font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
              <span className="absolute bottom-1 w-full text-center text-[10px] text-gray-500 uppercase font-black uppercase tracking-widest">Sec</span>
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <label className="text-sm font-bold text-gray-400 uppercase tracking-wider ml-1">Notes (Optional)</label>
          <textarea 
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            placeholder="How did it feel?"
            rows={3}
            className="w-full bg-[#1a1a1a] text-white border border-gray-800 rounded-2xl px-4 py-4 text-base focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-700 resize-none"
          />
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
