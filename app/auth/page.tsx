'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

type Mode = 'login' | 'signup';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    localStorage.setItem('impactbridge_authenticated', 'true');
    localStorage.setItem('impactbridge_user_email', email);
    if (name.trim()) localStorage.setItem('impactbridge_user_name', name.trim());
    router.replace('/');
  };

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="bg-blue-600 text-white font-bold px-3 py-1.5 rounded-lg text-lg">IB</div>
            <span className="text-2xl font-extrabold tracking-tight text-white">ImpactBridge</span>
          </div>
          <p className="text-slate-400">CSR-NGO partnership intelligence platform</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <div className="grid grid-cols-2 bg-slate-100 rounded-xl p-1 mb-7">
            <button type="button" onClick={() => { setMode('login'); setError(''); }} className={`py-2.5 rounded-lg text-sm font-semibold transition ${mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Login</button>
            <button type="button" onClick={() => { setMode('signup'); setError(''); }} className={`py-2.5 rounded-lg text-sm font-semibold transition ${mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Sign Up</button>
          </div>

          <h1 className="text-2xl font-bold text-slate-900">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
          <p className="text-sm text-slate-500 mt-1 mb-6">{mode === 'login' ? 'Login to continue to your CSR dashboard.' : 'Set up your ImpactBridge account to get started.'}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Full name</label>
                <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600" placeholder="Your name" required />
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600" placeholder="you@company.com" required />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600" placeholder="••••••••" minLength={6} required />
            </div>
            {mode === 'signup' && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">Confirm password</label>
                <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600" placeholder="••••••••" minLength={6} required />
              </div>
            )}
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-md transition">{mode === 'login' ? 'Login to ImpactBridge' : 'Create ImpactBridge Account'}</button>
          </form>

          <p className="text-xs text-slate-400 mt-6 text-center">Demo authentication for the hackathon build. Connect this form to a real auth backend before production use.</p>
        </div>
      </div>
    </main>
  );
}
