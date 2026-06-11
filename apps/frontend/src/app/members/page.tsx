'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Member {
  id: string;
  name: string;
  phone: string;
  status: string;
  membership_end_date: string | null;
}

export default function MembersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/members', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setMembers(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMembers();
    }
  }, [user]);

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.phone.includes(search)
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this member?')) return;

    try {
      const response = await fetch(`/api/members/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        fetchMembers();
      }
    } catch (error) {
      console.error('Delete failed');
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
          <Link href="/members" className="px-4 py-3 text-sm font-medium bg-[#1a1a1a] text-white rounded-lg">Members</Link>
          <Link href="/payments" className="px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-[#111111] rounded-lg">Payments</Link>
          <Link href="/leads" className="px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-[#111111] rounded-lg">Leads</Link>
          <Link href="/website-settings" className="px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-[#111111] rounded-lg">Website Settings</Link>
        </nav>
      </div>

      <div className="flex-1 p-6 md:p-10 lg:p-12">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tighter">Members</h1>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md bg-[#111111] border border-[#222222] px-6 py-3 text-lg placeholder-gray-500 focus:outline-none rounded-xl"
          />
        </div>

        {loading ? (
          <div className="text-gray-400">Loading members...</div>
        ) : (
          <div className="bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#222222]">
                  <th className="text-left px-8 py-4 text-sm text-gray-500 font-medium">Name</th>
                  <th className="text-left px-8 py-4 text-sm text-gray-500 font-medium">Phone</th>
                  <th className="text-left px-8 py-4 text-sm text-gray-500 font-medium">Status</th>
                  <th className="text-left px-8 py-4 text-sm text-gray-500 font-medium">End Date</th>
                  <th className="px-8 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-8 text-gray-400">No members found.</td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => (
                    <tr key={member.id} className="border-b border-[#222222] last:border-b-0">
                      <td className="px-8 py-5">{member.name}</td>
                      <td className="px-8 py-5 text-gray-400">{member.phone}</td>
                      <td className="px-8 py-5">
                        <span className={
                          member.status === 'Active' ? 'text-emerald-400' :
                          member.status === 'Frozen' ? 'text-amber-400' : 'text-red-400'
                        }>
                          {member.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-gray-400">{member.membership_end_date || '—'}</td>
                      <td className="px-8 py-5 text-right">
                        <button
                          onClick={() => handleDelete(member.id)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Delete
                        </button>
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