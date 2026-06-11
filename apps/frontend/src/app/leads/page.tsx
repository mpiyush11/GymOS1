'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: string;
}

export default function LeadsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [user, isLoading, router]);

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/leads', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setLeads(data.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchLeads();
  }, [user]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (res.ok) fetchLeads();
    } catch (error) {
      console.error('Update failed');
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
          <Link href="/leads" className="px-4 py-3 text-sm font-medium bg-[#1a1a1a] text-white rounded-lg">Leads</Link>
          <Link href="/website-settings" className="px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-[#111111] rounded-lg">Website Settings</Link>
        </nav>
      </div>

      <div className="flex-1 p-6 md:p-10 lg:p-12">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tighter">Leads</h1>
        </div>

        {loading ? (
          <div className="text-gray-400">Loading leads...</div>
        ) : (
          <div className="bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#222222]">
                  <th className="text-left px-8 py-4 text-sm text-gray-500 font-medium">Name</th>
                  <th className="text-left px-8 py-4 text-sm text-gray-500 font-medium">Phone</th>
                  <th className="text-left px-8 py-4 text-sm text-gray-500 font-medium">Email</th>
                  <th className="text-left px-8 py-4 text-sm text-gray-500 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr><td colSpan={4} className="px-8 py-8 text-gray-400">No leads yet.</td></tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead.id} className="border-b border-[#222222] last:border-b-0">
                      <td className="px-8 py-5">{lead.name}</td>
                      <td className="px-8 py-5 text-gray-400">{lead.phone}</td>
                      <td className="px-8 py-5 text-gray-400">{lead.email || '—'}</td>
                      <td className="px-8 py-5">
                        <select
                          value={lead.status}
                          onChange={(e) => updateStatus(lead.id, e.target.value)}
                          className="bg-[#0a0a0a] border border-[#222222] px-4 py-1 rounded-lg text-sm"
                        >
                          <option value="new">new</option>
                          <option value="contacted">contacted</option>
                          <option value="converted">converted</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}