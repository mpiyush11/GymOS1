'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function WebsiteSettingsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    public_slug: '',
    phone: '',
    whatsapp: '',
    email: '',
    hero_headline: '',
    hero_subheadline: '',
    cta_text: '',
  });
  const [slugError, setSlugError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetch('/api/website-settings', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (data) setForm({ ...form, ...data });
        });
    }
  }, [user]);

  const handleSlugChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setForm({ ...form, public_slug: sanitized });

    if (sanitized && !/^[a-z0-9-]+$/.test(sanitized)) {
      setSlugError('Only lowercase letters, numbers, and hyphens allowed');
    } else {
      setSlugError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (slugError) return;

    setSaving(true);
    try {
      await fetch('/api/website-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      alert('Settings saved');
    } catch (error) {
      console.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !user) {
    return <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col md:flex-row">
      <div className="w-full md:w-64 bg-[#111111] border-b md:border-b-0 md:border-r border-[#222222] p-6 md:p-8">
        <div className="mb-8 md:mb-12">
          <div className="text-2xl font-semibold tracking-tighter">GYMOS</div>
          <div className="text-xs text-gray-500 mt-1">INTERNAL PORTAL</div>
        </div>
        <nav className="flex flex-row md:flex-col gap-2 md:gap-1">
          <Link href="/dashboard" className="px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-[#111111] rounded-lg">Dashboard</Link>
          <Link href="/members" className="px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-[#111111] rounded-lg">Members</Link>
          <Link href="/payments" className="px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-[#111111] rounded-lg">Payments</Link>
          <Link href="/leads" className="px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-[#111111] rounded-lg">Leads</Link>
          <Link href="/website-settings" className="px-4 py-3 text-sm font-medium bg-[#1a1a1a] text-white rounded-lg">Website Settings</Link>
        </nav>
      </div>

      <div className="flex-1 p-6 md:p-10 lg:p-12 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tighter">Website Settings</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Public Slug</label>
            <input
              type="text"
              value={form.public_slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              className="w-full bg-[#111111] border border-[#222222] px-6 py-4 rounded-xl text-lg"
              placeholder="my-gym-name"
            />
            {slugError && <p className="text-red-400 text-sm mt-1">{slugError}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Phone</label>
              <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full bg-[#111111] border border-[#222222] px-6 py-4 rounded-xl" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">WhatsApp</label>
              <input type="text" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className="w-full bg-[#111111] border border-[#222222] px-6 py-4 rounded-xl" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Hero Headline</label>
            <input type="text" value={form.hero_headline} onChange={(e) => setForm({ ...form, hero_headline: e.target.value })} className="w-full bg-[#111111] border border-[#222222] px-6 py-4 rounded-xl" />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Hero Subheadline</label>
            <input type="text" value={form.hero_subheadline} onChange={(e) => setForm({ ...form, hero_subheadline: e.target.value })} className="w-full bg-[#111111] border border-[#222222] px-6 py-4 rounded-xl" />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">CTA Text</label>
            <input type="text" value={form.cta_text} onChange={(e) => setForm({ ...form, cta_text: e.target.value })} className="w-full bg-[#111111] border border-[#222222] px-6 py-4 rounded-xl" />
          </div>

          <button
            type="submit"
            disabled={saving || !!slugError}
            className="mt-6 bg-white text-black px-8 py-4 rounded-xl font-medium disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
}