'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Gym {
  id: string;
  name: string;
  created_at: string;
}

export default function GlobalGymRegistryPage() {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchGyms = async () => {
    try {
      const response = await fetch('/api/gyms', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setGyms(data.data || []);
      } else {
        console.error('Failed to load global registry');
      }
    } catch (error) {
      console.error('Network failure accessing master node');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGyms();
  }, []);

  const filteredGyms = gyms.filter((gym) =>
    gym.name.toLowerCase().includes(search.toLowerCase()) ||
    gym.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        {/* Symmetrical Master Header Block */}
        <div className="mb-12 border-b border-[#151515] pb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-semibold tracking-tighter">Global Tenant Registry</h1>
            <p className="text-gray-500 text-sm mt-1 tracking-wide">MASTER ADMINISTRATIVE NODE</p>
          </div>
          <button 
            onClick={() => router.push('/superadmin/login')}
            className="text-sm text-gray-400 hover:text-white transition px-4 py-2 border border-[#222222] rounded-lg bg-[#111111]"
          >
            System Disconnect
          </button>
        </div>

        {/* Symmetrical Controls Segment */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search active tenants by name or unique ID tokens..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111111] border border-[#222222] text-white px-6 py-4 text-lg placeholder-gray-500 focus:outline-none focus:border-[#444444] rounded-xl transition"
          />
        </div>

        {loading ? (
          <div className="text-gray-500 text-sm font-light tracking-wide">Querying master cluster data...</div>
        ) : (
          /* Razor-Sharp Data Grid Table Core */
          <div className="bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#222222] bg-[#161616]">
                  <th className="px-8 py-4 text-sm text-gray-400 font-medium tracking-wide">Gym Name</th>
                  <th className="px-8 py-4 text-sm text-gray-400 font-medium tracking-wide">System Identifier Token (ID)</th>
                  <th className="px-8 py-4 text-sm text-gray-400 font-medium tracking-wide">Creation Date</th>
                  <th className="px-8 py-4 text-sm text-gray-400 font-medium tracking-wide">Operational Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredGyms.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-12 text-center text-gray-500 font-light">
                      No matching active gym tenants registered in system nodes.
                    </td>
                  </tr>
                ) : (
                  filteredGyms.map((gym) => (
                    <tr key={gym.id} className="border-b border-[#222222] last:border-b-0 hover:bg-[#151515] transition">
                      <td className="px-8 py-5 font-medium">{gym.name}</td>
                      <td className="px-8 py-5 text-gray-400 font-mono text-sm tracking-tight">{gym.id}</td>
                      <td className="px-8 py-5 text-gray-400 text-sm">
                        {gym.created_at ? new Date(gym.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-emerald-400 bg-emerald-950/30 px-3 py-1 rounded-full text-xs font-medium border border-emerald-900/50">
                          Active Tenant
                        </span>
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