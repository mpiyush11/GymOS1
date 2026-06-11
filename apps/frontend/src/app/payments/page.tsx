'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Payment {
  id: string;
  amount: number;
  payment_method: string;
  created_at: string;
  member_id: string;
}

export default function PaymentsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ member_id: '', plan_id: '', payment_method: 'cash' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [user, isLoading, router]);

  const fetchPayments = async () => {
    try {
      const res = await fetch('/api/payments', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setPayments(data.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchPayments();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowModal(false);
        setForm({ member_id: '', plan_id: '', payment_method: 'cash' });
        fetchPayments();
      }
    } catch (error) {
      console.error('Payment failed');
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
          <Link href="/payments" className="px-4 py-3 text-sm font-medium bg-[#1a1a1a] text-white rounded-lg">Payments</Link>
          <Link href="/leads" className="px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-[#111111] rounded-lg">Leads</Link>
          <Link href="/website-settings" className="px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-[#111111] rounded-lg">Website Settings</Link>
        </nav>
      </div>

      <div className="flex-1 p-6 md:p-10 lg:p-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tighter">Payments</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-white text-black px-6 py-3 rounded-xl text-sm font-medium"
          >
            Record Renewal Payment
          </button>
        </div>

        {loading ? (
          <div className="text-gray-400">Loading payments...</div>
        ) : (
          <div className="bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#222222]">
                  <th className="text-left px-8 py-4 text-sm text-gray-500 font-medium">Amount</th>
                  <th className="text-left px-8 py-4 text-sm text-gray-500 font-medium">Method</th>
                  <th className="text-left px-8 py-4 text-sm text-gray-500 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr><td colSpan={3} className="px-8 py-8 text-gray-400">No payments yet.</td></tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="border-b border-[#222222] last:border-b-0">
                      <td className="px-8 py-5 font-medium">₹{p.amount}</td>
                      <td className="px-8 py-5 text-gray-400">{p.payment_method}</td>
                      <td className="px-8 py-5 text-gray-400">{new Date(p.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#111111] border border-[#222222] rounded-2xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-semibold mb-6">Record Payment</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Member ID"
                value={form.member_id}
                onChange={(e) => setForm({ ...form, member_id: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-[#222222] px-6 py-3 rounded-xl"
                required
              />
              <input
                type="text"
                placeholder="Plan ID"
                value={form.plan_id}
                onChange={(e) => setForm({ ...form, plan_id: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-[#222222] px-6 py-3 rounded-xl"
                required
              />
              <select
                value={form.payment_method}
                onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-[#222222] px-6 py-3 rounded-xl"
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
              </select>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-[#222222] rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-white text-black rounded-xl font-medium">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}