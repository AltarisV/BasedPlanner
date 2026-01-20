'use client';

import { useState } from 'react';

interface ObjectDefFormProps {
  onAdd: (name: string, widthCm: number, heightCm: number) => void;
}

export function ObjectDefForm({ onAdd }: ObjectDefFormProps) {
  const [name, setName] = useState('New Object');
  const [widthCm, setWidthCm] = useState(50);
  const [heightCm, setHeightCm] = useState(50);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim(), widthCm, heightCm);
    setName('New Object');
    setWidthCm(50);
    setHeightCm(50);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">Name</label>
        <input 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          placeholder="Object name"
          className="input-field" 
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">B (cm)</label>
          <input 
            type="number" 
            min={1} 
            value={widthCm} 
            onChange={(e)=>setWidthCm(Number(e.target.value))} 
            className="input-field w-full" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">H (cm)</label>
          <input 
            type="number" 
            min={1} 
            value={heightCm} 
            onChange={(e)=>setHeightCm(Number(e.target.value))} 
            className="input-field w-full" 
          />
        </div>
      </div>
      <button type="submit" className="w-full btn bg-emerald-600 hover:bg-emerald-700 text-white">
        Add Object
      </button>
    </form>
  );
}
