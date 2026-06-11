'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const success = await login(email, password);

    if (success) {
      router.push('/dashboard');
    } else {
      setError('Invalid credentials');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="mb-10">
          <div className="text-4xl font-semibold tracking-tighter text-white">GYMOS</div>
          <div className="text-gray-400 mt-2 text-lg">Internal Portal</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#111111] border border-[#222222] text-white px-6 py-4 text-lg placeholder-gray-500 focus:outline-none focus:border-[#444444] rounded-xl"
              required
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
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
            className="w-full bg-white text-black py-4 text-lg font-medium rounded-xl hover:bg-gray-200 transition disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}