"use client";

import { useState, useEffect } from 'react';
import { getStoreConfig, updateStoreConfig } from '@/lib/actions/config';
import { toast } from 'sonner';

export default function ConfigPage() {
  const [hero, setHero] = useState({
    title: '',
    subtitle: '',
    ctaText: '',
    ctaLink: '',
    imageUrl: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
interface HeroConfig {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  imageUrl: string;
}

// ... inside component ...
    getStoreConfig('homepage_hero')
      .then((data: unknown) => {
        if (data && typeof data === 'object') setHero(data as HeroConfig);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateStoreConfig('homepage_hero', hero);
      toast.success('Homepage updated successfully!');
    } catch {
      toast.error('Failed to update.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading config...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Homepage Configuration</h1>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
        <h2 className="text-lg font-semibold border-b pb-2">Hero Section</h2>
        
        <div className="space-y-4">
          <div>
             <label className="block text-sm font-medium mb-1">Main Title</label>
             <input 
               value={hero.title}
               onChange={e => setHero({...hero, title: e.target.value})}
               className="w-full border rounded-md p-2"
               placeholder="e.g. Summer Collection 2025"
             />
          </div>

          <div>
             <label className="block text-sm font-medium mb-1">Subtitle</label>
             <textarea 
               value={hero.subtitle}
               onChange={e => setHero({...hero, subtitle: e.target.value})}
               className="w-full border rounded-md p-2 h-24"
               placeholder="Description text..."
             />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium mb-1">CTA Text</label>
                <input 
                  value={hero.ctaText}
                  onChange={e => setHero({...hero, ctaText: e.target.value})}
                  className="w-full border rounded-md p-2"
                  placeholder="Shop Now"
                />
             </div>
             <div>
                <label className="block text-sm font-medium mb-1">CTA Link</label>
                <input 
                  value={hero.ctaLink}
                  onChange={e => setHero({...hero, ctaLink: e.target.value})}
                  className="w-full border rounded-md p-2"
                  placeholder="/shop"
                />
             </div>
          </div>

          <div>
             <label className="block text-sm font-medium mb-1">Background Image URL</label>
             <input 
               value={hero.imageUrl}
               onChange={e => setHero({...hero, imageUrl: e.target.value})}
               className="w-full border rounded-md p-2"
               placeholder="https://..."
             />
             <p className="text-xs text-gray-500 mt-1">Use a high-quality image URL (1920x1080 recommended).</p>
          </div>
        </div>
      </div>
    </div>
  );
}
