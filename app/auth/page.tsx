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
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (mode === 'signup' && password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const response = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode, name, email, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Authentication failed.');
      localStorage.setItem('impactbridge_authenticated', 'true');
      localStorage.setItem('impactbridge_user_email', data.user.email);
      localStorage.setItem('impactbridge_user_name', data.user.name);
      localStorage.removeItem('impactbridge_auth_token');
      router.replace('/');
    } catch (err) { setError(err instanceof Error ? err.message : 'Authentication failed.'); }
    finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen bg-[#eef4ff] flex items-center justify-center px-5 py-8 font-sans">
      <div className="w-full max-w-5xl min-h-[620px] bg-white rounded-[32px] overflow-hidden shadow-2xl grid md:grid-cols-2 border border-white">
        <section className="hidden md:flex bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-24 -top-24 w-72 h-72 rounded-full bg-white/10" />
          <div className="absolute -left-20 bottom-10 w-56 h-56 rounded-full bg-white/10" />
          <div className="relative z-10"><div className="flex items-center gap-3"><div className="bg-white text-blue-700 font-black px-3 py-1.5 rounded-xl text-lg">IB</div><span className="text-2xl font-black tracking-tight">ImpactBridge</span></div><div className="mt-20"><p className="text-blue-100 font-semibold uppercase tracking-[0.2em] text-xs">CSR × NGO</p><h2 className="text-5xl font-black leading-tight mt-4">Turn intent<br/>into <span className="text-blue-200">impact.</span></h2><p className="text-blue-100 mt-6 text-lg leading-7 max-w-sm">Connect CSR initiatives with trusted implementation partners and make every project count.</p></div></div>
          <div className="relative z-10 text-sm text-blue-100">AI-powered partnership intelligence</div>
        </section>

        <section className="p-7 sm:p-10 md:p-12 flex flex-col justify-center">
          <div className="md:hidden flex items-center gap-3 mb-8"><div className="bg-blue-600 text-white font-black px-3 py-1.5 rounded-xl">IB</div><span className="text-xl font-black text-slate-900">ImpactBridge</span></div>
          <div className="mb-7"><p className="text-blue-600 font-bold text-sm mb-2">WELCOME TO IMPACTBRIDGE</p><h1 className="text-3xl font-black text-slate-950 tracking-tight">{mode === 'login' ? 'Welcome back.' : 'Create your account.'}</h1><p className="text-slate-500 mt-2">{mode === 'login' ? 'Sign in to continue to your dashboard.' : 'Join the CSR-NGO impact network.'}</p></div>
          <div className="grid grid-cols-2 bg-slate-100 rounded-2xl p-1.5 mb-7"><button type="button" onClick={() => {setMode('login');setError('');}} className={`py-3 rounded-xl text-sm font-bold transition ${mode==='login'?'bg-white text-slate-950 shadow':'text-slate-500'}`}>Login</button><button type="button" onClick={() => {setMode('signup');setError('');}} className={`py-3 rounded-xl text-sm font-bold transition ${mode==='signup'?'bg-white text-slate-950 shadow':'text-slate-500'}`}>Sign Up</button></div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode==='signup' && <div><label htmlFor="name" className="block text-sm font-bold text-slate-700 mb-2">Full name</label><input id="name" type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition" placeholder="Your name" required /></div>}
            <div><label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2">Email address</label><input id="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition" placeholder="you@company.com" required /></div>
            <div><label htmlFor="password" className="block text-sm font-bold text-slate-700 mb-2">Password</label><input id="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition" placeholder="••••••••" minLength={6} required /></div>
            {mode==='signup' && <div><label htmlFor="confirmPassword" className="block text-sm font-bold text-slate-700 mb-2">Confirm password</label><input id="confirmPassword" type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition" placeholder="••••••••" minLength={6} required /></div>}
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-[0.99]">{loading?'Please wait...':mode==='login'?'Sign in':'Create account'}</button>
          </form>
          <p className="text-center text-xs text-slate-400 mt-7">Secure access to your ImpactBridge workspace</p>
        </section>
      </div>
    </main>
  );
}
