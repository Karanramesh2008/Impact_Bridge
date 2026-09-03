'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

type Mode = 'login' | 'signup';
type Role = 'CSR' | 'NGO';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [role, setRole] = useState<Role>('CSR');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const changeMode = (nextMode: Mode) => {
    setMode(nextMode);
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, name, email, password }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.detail || 'Authentication failed.');

      localStorage.setItem('impactbridge_authenticated', 'true');
      localStorage.setItem('impactbridge_user_email', data.user.email);
      localStorage.setItem('impactbridge_user_name', data.user.name);
      localStorage.setItem('impactbridge_user_role', role);
      localStorage.removeItem('impactbridge_auth_token');

      // NGO partners go directly to the tender/quotation workspace.
      router.replace(role === 'NGO' ? '/tenders' : '/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8 font-sans">
      <div className="w-full max-w-2xl bg-white rounded-[30px] shadow-xl border border-slate-200 overflow-hidden">
        <div className="px-7 sm:px-12 pt-9 pb-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-blue-600 text-white font-black px-3 py-1.5 rounded-xl text-lg shadow-sm">IB</div>
            <span className="text-2xl font-black tracking-tight text-slate-950">ImpactBridge</span>
          </div>

          <div className="mb-7">
            <p className="text-blue-600 font-bold text-xs tracking-[0.16em] mb-2">CSR × NGO IMPACT NETWORK</p>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              {mode === 'login' ? 'Welcome back.' : 'Create your account.'}
            </h1>
            <p className="text-slate-500 mt-2">
              {mode === 'login' ? 'Sign in to continue to ImpactBridge.' : 'Choose your role and join the impact network.'}
            </p>
          </div>

          <div className="grid grid-cols-2 bg-slate-100 rounded-2xl p-1.5 mb-7">
            <button type="button" onClick={() => changeMode('login')} className={`py-3 rounded-xl text-sm font-bold transition ${mode === 'login' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Login</button>
            <button type="button" onClick={() => changeMode('signup')} className={`py-3 rounded-xl text-sm font-bold transition ${mode === 'signup' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Sign Up</button>
          </div>

          <div className="mb-6">
            <p className="text-sm font-bold text-slate-800 mb-3">{mode === 'login' ? 'I am logging in as' : 'I am signing up as'}</p>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setRole('CSR')} className={`rounded-2xl border-2 p-4 text-left transition ${role === 'CSR' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}>
                <span className="text-lg">🏢</span><span className="block font-bold mt-1">CSR Company</span><span className="block text-xs mt-1 opacity-80">Publish projects & tenders</span>
              </button>
              <button type="button" onClick={() => setRole('NGO')} className={`rounded-2xl border-2 p-4 text-left transition ${role === 'NGO' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}>
                <span className="text-lg">🤝</span><span className="block font-bold mt-1">NGO Partner</span><span className="block text-xs mt-1 opacity-80">View tenders & submit quotes</span>
              </button>
            </div>
          </div>

          {role === 'NGO' && <div className="mb-5 rounded-2xl bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-800"><strong>NGO Partner flow:</strong> After login, you will see tenders invited to your email and can submit your price, delivery timeline, and proposal.</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && <div><label htmlFor="name" className="block text-sm font-bold text-slate-800 mb-2">Full name</label><input id="name" type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-white text-slate-950 placeholder:text-slate-400 border border-slate-300 rounded-2xl px-4 py-3.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition" placeholder="Enter your full name" required /></div>}
            <div><label htmlFor="email" className="block text-sm font-bold text-slate-800 mb-2">Email address</label><input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white text-slate-950 placeholder:text-slate-400 border border-slate-300 rounded-2xl px-4 py-3.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition" placeholder="Enter your email address" required /></div>
            <div><label htmlFor="password" className="block text-sm font-bold text-slate-800 mb-2">Password</label><input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white text-slate-950 placeholder:text-slate-400 border border-slate-300 rounded-2xl px-4 py-3.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition" placeholder="Enter your password" minLength={6} required /></div>
            {mode === 'signup' && <div><label htmlFor="confirmPassword" className="block text-sm font-bold text-slate-800 mb-2">Confirm password</label><input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-white text-slate-950 placeholder:text-slate-400 border border-slate-300 rounded-2xl px-4 py-3.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition" placeholder="Confirm your password" minLength={6} required /></div>}
            {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-[0.99]">{loading ? 'Please wait...' : mode === 'login' ? `Login as ${role === 'NGO' ? 'NGO Partner' : 'CSR Company'}` : `Create ${role === 'NGO' ? 'NGO Partner' : 'CSR'} account`}</button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-7">Your role is used for the current workspace and does not modify the existing login database schema.</p>
        </div>
      </div>
    </main>
  );
}
