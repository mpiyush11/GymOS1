'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DashboardStats {
  activeCount: number;
  expiringCount: number;
  expiredCount: number;
  totalRevenue: number;
  newLeads: number;
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetchDashboardStats();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setStats({
          activeCount: data.activeCount || 0,
          expiringCount: data.expiringCount || 0,
          expiredCount: data.expiredCount || 0,
          totalRevenue: data.totalRevenue || 0,
          newLeads: data.newLeads || 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats');
    } finally {
      setLoadingStats(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
        <div className="text-2xl font-light tracking-wide">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col md:flex-row">
      {/* Symmetrical Responsive Sidebar Shell */}
      <div className="w-full md:w-64 bg-[#111111] border-b md:border-b-0 md:border-r border-[#222222] p-6 md:p-8 flex flex-col md:min-h-screen dynamic-sidebar">
        <div className="mb-8 md:mb-12">
          <div className="text-2xl font-semibold tracking-tighter">GYMOS</div>
          <div className="text-xs text-gray-500 mt-1">INTERNAL PORTAL</div>
        </div>

        <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible gap-2 md:gap-1 pb-2 md:pb-0 scrollbar-none">
          <Link href="/dashboard" className="whitespace-nowrap px-4 py-3 text-sm font-medium bg-[#1a1a1a] text-white rounded-lg transition">Dashboard</Link>
          <Link href="/members" className="whitespace-nowrap px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-[#111111] rounded-lg transition">Members</Link>
          <Link href="/payments" className="whitespace-nowrap px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-[#111111] rounded-lg transition">Payments</Link>
          <Link href="/leads" className="whitespace-nowrap px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-[#111111] rounded-lg transition">Leads</Link>
          <Link href="/website-settings" className="whitespace-nowrap px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-[#111111] rounded-lg transition">Website Settings</Link>
        </nav>
      </div>

      {/* Symmetrical Fluid Content Wrapper (Fixed Right Margin Hole) */}
      <div className="flex-1 p-6 md:p-10 lg:p-12 w-full max-w-full">
        <div className="mb-8 md:mb-12 border-b border-[#151515] pb-6">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tighter">Dashboard</h1>
          <p className="text-gray-400 mt-2 text-base md:text-lg">Real-time business telemetry</p>
        </div>

        {loadingStats ? (
          <div className="text-gray-400 text-sm font-light">Loading metrics...</div>
        ) : (
          /* Mathematically Balanced Grid Layout Matrix */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6 w-full">
            {/* Active Members */}
            <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6 md:p-8 flex flex-col justify-between min-h-[160px]">
              <div className="text-xs text-gray-500 tracking-widest font-medium">ACTIVE MEMBERS</div>
              <div className="text-3xl sm:text-4xl lg:text-4xl xl:text-5xl font-semibold tabular-nums tracking-tighter truncate mt-4">
                {stats?.activeCount ?? 0}
              </div>
            </div>

            {/* Expiring Soon */}
            <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6 md:p-8 flex flex-col justify-between min-h-[160px]">
              <div className="text-xs text-gray-500 tracking-widest font-medium">EXPIRING SOON</div>
              <div className="text-3xl sm:text-4xl lg:text-4xl xl:text-5xl font-semibold tabular-nums tracking-tighter text-amber-400 truncate mt-4">
                {stats?.expiringCount ?? 0}
              </div>
            </div>

            {/* Expired */}
            <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6 md:p-8 flex flex-col justify-between min-h-[160px]">
              <div className="text-xs text-gray-500 tracking-widest font-medium">EXPIRED</div>
              <div className="text-3xl sm:text-4xl lg:text-4xl xl:text-5xl font-semibold tabular-nums tracking-tighter text-red-400 truncate mt-4">
                {stats?.expiredCount ?? 0}
              </div>
            </div>

            {/* Total Revenue */}
            <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6 md:p-8 flex flex-col justify-between min-h-[160px]">
              <div className="text-xs text-gray-500 tracking-widest font-medium">TOTAL REVENUE</div>
              <div className="text-3xl sm:text-4xl lg:text-4xl xl:text-5xl font-semibold tabular-nums tracking-tighter truncate mt-4">
                ₹{(stats?.totalRevenue ?? 0).toLocaleString()}
              </div>
            </div>

            {/* New Leads */}
            <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6 md:p-8 flex flex-col justify-between min-h-[160px]">
              <div className="text-xs text-gray-500 tracking-widest font-medium">NEW LEADS</div>
              <div className="text-3xl sm:text-4xl lg:text-4xl xl:text-5xl font-semibold tabular-nums tracking-tighter text-emerald-400 truncate mt-4">
                {stats?.newLeads ?? 0}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}