'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SuperAdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user && data.user.role === 'superadmin') {
          router.push('/superadmin/gyms');
        } else {
          setError('Access Denied: Invalid Master Credentials');
        }
      } else {
        setError('Access Denied: Invalid Master Credentials');
      }
    } catch (err) {
      setError('Access Denied: Invalid Master Credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="mb-12">
          <div className="text-3xl font-semibold tracking-tighter text-white">GYMOS / CORE MASTER</div>
          <div className="text-gray-400 mt-3 text-lg">Platform Administration</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="email"
              placeholder="Master Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#111111] border border-[#222222] text-white px-6 py-4 text-lg placeholder-gray-500 focus:outline-none focus:border-[#444444] rounded-xl"
              required
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Master Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#111111] border border-[#222222] text-white px-6 py-4 text-lg placeholder-gray-500 focus:outline-none focus:border-[#444444] rounded-xl"
              required
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm px-1">{error}</div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white text-black py-4 text-lg font-medium rounded-xl hover:bg-gray-200 transition disabled:opacity-50 mt-4"
          >
            {isLoading ? 'Verifying...' : 'Access System Control Platform'}
          </button>
        </form>
      </div>
    </div>
  );
}