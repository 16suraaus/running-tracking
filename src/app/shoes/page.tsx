'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, CheckCircle, ShieldAlert } from 'lucide-react';
import { Shoe } from '@/types';

export default function ShoesPage() {
  const router = useRouter();
  const [shoes, setShoes] = useState<Shoe[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [brand, setBrand] = useState('');
  const [name, setName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchShoes();
  }, []);

  const fetchShoes = async () => {
    try {
      const res = await fetch('/api/shoes');
      if (res.ok) {
        const data = await res.json();
        setShoes(data);
      }
    } catch (error) {
      console.error('Error fetching shoes:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setBrand('');
    setName('');
    setIsDefault(false);
  };

  const handleAddShoe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand || !name) return;
    setSaving(true);
    
    try {
      const res = await fetch('/api/shoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand, name, is_default: isDefault }),
      });
      if (res.ok) {
        clearForm();
        await fetchShoes();
      }
    } catch (error) {
      console.error('Failed to add shoe', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await fetch('/api/shoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_default: true }),
      });
      fetchShoes();
    } catch (err) {}
  };

  const handleRetire = async (id: number) => {
    try {
      await fetch('/api/shoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, retired: true }),
      });
      fetchShoes();
    } catch (err) {}
  };

  return (
    <div className="p-4 pt-10">
      <div className="flex flex-col mb-8">
        <h1 className="text-3xl font-black italic tracking-tighter text-white uppercase drop-shadow-md">Your Gear</h1>
        <p className="text-gray-400 font-medium">Manage your shoe rotation.</p>
      </div>

      <form onSubmit={handleAddShoe} className="bg-[#1a1a1a] border border-gray-800 rounded-3xl p-5 shadow-lg mb-8">
        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-4 px-1">Add New Shoe</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Brand</label>
            <input 
              required
              type="text" 
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. Nike"
              className="w-full bg-[#121212] border border-gray-800 rounded-xl p-4 text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-gray-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Model / Name</label>
            <input 
              required
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Pegasus 40"
              className="w-full bg-[#121212] border border-gray-800 rounded-xl p-4 text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-gray-600"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-[#121212] rounded-xl border border-gray-800">
            <span className="text-sm font-bold text-gray-300">Set as Default Shoe</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>

          <button 
            type="submit" 
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl flex justify-center items-center transition-all disabled:opacity-50 mt-4 active:scale-95 shadow-lg shadow-blue-500/20"
          >
            <Plus className="mr-2" size={20} strokeWidth={3} />
            {saving ? 'SAVING...' : 'ADD SHOE'}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest px-1">Active Rotation</h3>
        
        {loading ? (
          <div className="p-4 text-center text-gray-500 animate-pulse font-bold">Loading...</div>
        ) : shoes.length === 0 ? (
          <div className="p-8 text-center text-gray-600 font-bold bg-[#1a1a1a] rounded-2xl border border-gray-800">
            No active shoes. Add one above!
          </div>
        ) : (
          shoes.map((shoe) => (
            <div key={shoe.id} className={`p-5 rounded-2xl border transition-all ${shoe.is_default ? 'bg-blue-900/20 border-blue-500/50' : 'bg-[#1a1a1a] border-gray-800'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-lg font-black text-white">{shoe.brand} {shoe.name}</h4>
                  {shoe.is_default && (
                    <span className="inline-flex items-center mt-2 px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-blue-500/20 text-blue-400">
                      <CheckCircle size={10} className="mr-1" strokeWidth={3} />
                      Primary Default
                    </span>
                  )}
                </div>
                
                <div className="flex flex-col space-y-2">
                  {!shoe.is_default && (
                    <button 
                      onClick={() => handleSetDefault(shoe.id)}
                      className="text-xs font-bold text-gray-400 hover:text-white bg-[#121212] px-3 py-2 rounded-lg border border-gray-800 transition-colors"
                    >
                      Make Default
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      if(window.confirm('Retire these shoes? They will no longer appear in the add run list.')) handleRetire(shoe.id)
                    }}
                    className="flex justify-center items-center text-xs font-bold text-red-500/70 hover:text-red-400 bg-[#121212] px-3 py-2 rounded-lg border border-red-900/30 hover:border-red-900/50 transition-colors"
                  >
                    <ShieldAlert size={14} className="mr-1" /> Retire
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
