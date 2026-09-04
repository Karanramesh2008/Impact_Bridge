'use client';

import { useState } from 'react';

interface Ngo {
  ngo_id: number;
  ngo_name: string;
  match_score: number;
  impact_score: number;
  risk_score: number;
  risk_level: string;
  budget_fit: number;
  why_this_ngo: string;
  domains?: string[];
  locations?: string[];
}

const formatDate = (value: string) => {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'form' | 'matching' | 'detail'>('dashboard');
  const [projectName, setProjectName] = useState('Rural Education Initiative');
  const [domain, setDomain] = useState('Education');
  const [location, setLocation] = useState('Tamil Nadu');
  const [budget, setBudget] = useState('2500000');
  const [deadline, setDeadline] = useState('2026-10-30');
  const [selectedNgo, setSelectedNgo] = useState<Ngo | null>(null);
  const [ngoResults, setNgoResults] = useState<Ngo[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, location, beneficiary: 'Students', budget: Number(budget), expertise: domain, deadline }),
      });
      if (!response.ok) throw new Error('Failed to get NGO matches');
      const data = await response.json();
      setNgoResults(data.matches || []);
      setActiveTab('matching');
    } catch (error) {
      console.error('API Error:', error);
      alert('Unable to load NGO matches. Please check that the matching backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (ngo: Ngo) => {
    setSelectedNgo(ngo);
    setActiveTab('detail');
  };

  const handleLogout = () => { window.location.href = '/logout'; };

  return (
    <div className="min-h-screen bg-[#f6f8fc] font-sans text-slate-800">
      <nav className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-20 flex items-center justify-between">
          <button type="button" onClick={() => setActiveTab('dashboard')} className="flex items-center gap-3 group">
            <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white grid place-items-center font-black text-lg shadow-lg shadow-blue-600/20 group-hover:scale-105 transition">IB</span>
            <span className="text-xl font-extrabold tracking-tight text-slate-950">Impact<span className="text-blue-600">Bridge</span></span>
          </button>
          <div className="hidden md:flex items-center gap-1">
            <button type="button" onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 rounded-xl text-sm font-semibold ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-100'}`}>Dashboard</button>
            <button type="button" onClick={() => { window.location.href = '/tenders'; }} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900">CSR Tenders</button>
            <button type="button" onClick={handleLogout} className="ml-2 px-4 py-2 rounded-xl text-sm font-semibold text-red-600 bg-red-50 border border-red-100 hover:bg-red-100">Logout</button>
          </div>
          <button type="button" onClick={handleLogout} className="md:hidden px-3 py-2 rounded-xl text-sm font-semibold text-red-600 bg-red-50">Logout</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-5 sm:px-8 py-8 sm:py-10">
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 text-white p-7 sm:p-10 shadow-2xl shadow-blue-900/10 mb-8">
          <div className="absolute -right-20 -top-24 w-72 h-72 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute right-24 bottom-[-90px] w-64 h-64 rounded-full bg-indigo-400/20 blur-3xl" />
          <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-7">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-100 mb-4"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> AI-powered CSR partner discovery</div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">Build impact.<br /><span className="text-blue-300">Choose the right partner.</span></h1>
              <p className="mt-4 text-blue-100/80 text-sm sm:text-base leading-7">Discover verified NGO partners, compare compatibility, and make evidence-based CSR decisions from one workspace.</p>
            </div>
            <button type="button" onClick={() => setActiveTab('form')} className="relative w-full lg:w-auto bg-white text-slate-950 hover:bg-blue-50 px-6 py-3.5 rounded-2xl font-bold shadow-xl transition hover:-translate-y-0.5">+ Create CSR Initiative</button>
          </div>
        </section>

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                ['Available CSR Budget', '₹2.4 Cr', '↗', 'bg-blue-50', 'text-blue-700'],
                ['Active Projects', '18', '◆', 'bg-violet-50', 'text-violet-700'],
                ['Avg Impact Score', '73%', '★', 'bg-emerald-50', 'text-emerald-700'],
                ['Potential NGO Partners', '35+', '◎', 'bg-indigo-50', 'text-indigo-700'],
              ].map(([label, value, icon, bg, text]) => (
                <div key={label} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all">
                  <div className="flex items-center justify-between"><p className="text-sm font-medium text-slate-500">{label}</p><span className={`w-9 h-9 rounded-xl ${bg} ${text} grid place-items-center font-bold`}>{icon}</span></div>
                  <p className="text-3xl font-black text-slate-950 mt-4">{value}</p><p className="text-xs text-slate-400 mt-1">Updated for your workspace</p>
                </div>
              ))}
            </div>
            <div className="grid lg:grid-cols-[1.3fr_.7fr] gap-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-7 shadow-sm">
                <div className="flex items-center gap-3 mb-5"><span className="w-10 h-10 rounded-xl bg-blue-600 text-white grid place-items-center">✦</span><div><h2 className="font-bold text-slate-950 text-lg">Partner discovery</h2><p className="text-sm text-slate-500">Turn your CSR requirements into a ranked shortlist.</p></div></div>
                <div className="grid sm:grid-cols-3 gap-3 mb-6">{[['01','Define needs'],['02','AI matching'],['03','Verify & select']].map(([n,t]) => <div key={n} className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-400">{n}</p><p className="font-semibold mt-2">{t}</p></div>)}</div>
                <button type="button" onClick={() => setActiveTab('form')} className="bg-slate-950 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold transition">Start partner discovery →</button>
              </div>
              <div className="rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-7"><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-600">Quick access</p><h2 className="text-xl font-black text-slate-950 mt-2">Have an NGO tender?</h2><p className="text-sm text-slate-600 leading-6 mt-2">View open NGO opportunities and submit proposals from the CSR Tender Network.</p><button type="button" onClick={() => { window.location.href = '/tenders'; }} className="mt-6 w-full bg-white border border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white px-4 py-3 rounded-xl font-bold transition">Open CSR Tenders ↗</button></div>
            </div>
          </div>
        )}

        {activeTab === 'form' && (
          <section className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-5"><button type="button" onClick={() => setActiveTab('dashboard')} className="w-10 h-10 rounded-xl bg-white border border-slate-200 hover:bg-slate-100">←</button><div><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-600">CSR initiative</p><h2 className="text-2xl font-black text-slate-950">Define your requirements</h2></div></div>
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40 p-6 sm:p-9">
              <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4 mb-7 flex gap-3"><span className="text-xl">✨</span><p className="text-sm text-blue-900 leading-6"><b>AI matching is ready.</b> Add your project details and we&apos;ll rank NGOs based on domain, location, budget, expertise, experience and performance.</p></div>
              <form onSubmit={handleSubmitForm} className="space-y-6">
                <div><label className="block text-sm font-bold text-slate-700 mb-2">Project Title</label><input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-4 py-3.5 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition" required /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5"><div><label className="block text-sm font-bold text-slate-700 mb-2">CSR Focus Domain</label><select value={domain} onChange={(e) => setDomain(e.target.value)} className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-4 py-3.5 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition"><option>Education</option><option>Healthcare</option><option>Environment</option><option>Rural Development</option></select></div><div><label className="block text-sm font-bold text-slate-700 mb-2">Target Location</label><input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Vellore, Tamil Nadu" className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-4 py-3.5 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition" required /></div></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5"><div><label className="block text-sm font-bold text-slate-700 mb-2">Allocated Budget (₹)</label><input type="number" min="0" value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-4 py-3.5 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition" required /></div><div><label className="block text-sm font-bold text-slate-700 mb-2">Project Deadline</label><input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} min="2026-01-01" max="2026-12-31" className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-4 py-3.5 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition" required /><p className="text-xs text-slate-400 mt-2">Deadline must fall within 2026.</p></div></div>
                <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-600/20 transition">{loading ? 'Analyzing NGO Network…' : 'Find Best NGO Partners  →'}</button>
              </form>
            </div>
          </section>
        )}

        {activeTab === 'matching' && (
          <section>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-7"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-600">AI recommendation</p><h2 className="text-3xl font-black text-slate-950 mt-1">Recommended NGO Shortlist</h2><p className="text-sm text-slate-500 mt-2">{projectName} · {location} · {domain} · Deadline {formatDate(deadline)}</p></div><button type="button" onClick={() => setActiveTab('form')} className="text-sm font-bold text-blue-600 hover:text-blue-800">← Edit Requirements</button></div>
            <div className="rounded-2xl bg-slate-950 text-white p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div><p className="font-bold">{ngoResults.length} partner recommendations</p><p className="text-xs text-slate-400 mt-1">Ranked using compatibility, impact and budget fit.</p></div><span className="rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-300 px-3 py-1 text-xs font-bold">AI MATCHING COMPLETE</span></div>
            <div className="space-y-4">{ngoResults.map((ngo, index) => <article key={ngo.ngo_id} className="group bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all"><div className="flex flex-col lg:flex-row lg:items-center gap-5"><div className="flex items-start gap-4 flex-1"><div className="w-11 h-11 shrink-0 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-700 grid place-items-center font-black">{String(index + 1).padStart(2, '0')}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg sm:text-xl font-black text-slate-950">{ngo.ngo_name}</h3><span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 text-xs font-bold">{ngo.match_score}% Match</span></div><p className="text-sm text-slate-500 mt-2">{ngo.domains?.join(', ') || 'N/A'} <span className="text-slate-300">•</span> {ngo.locations?.join(', ') || 'N/A'}</p></div></div><div className="flex items-center justify-between lg:justify-end gap-5 lg:min-w-[300px]"><div><p className="text-xs text-slate-400">Impact Potential</p><div className="flex items-center gap-2 mt-1"><div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, ngo.impact_score)}%` }} /></div><span className="text-sm font-black">{ngo.impact_score}/100</span></div></div><button type="button" onClick={() => handleViewDetail(ngo)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md transition whitespace-nowrap">View AI Insights</button></div></div></article>)}{!ngoResults.length && <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center"><p className="font-bold text-slate-800">No NGO matches returned.</p><p className="text-sm text-slate-500 mt-1">Edit your requirements and run the matching engine again.</p></div>}</div>
          </section>
        )}

        {activeTab === 'detail' && selectedNgo && (
          <section>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-600">Partner due diligence</p><h2 className="text-3xl font-black text-slate-950 mt-1">{selectedNgo.ngo_name}</h2><p className="text-sm text-slate-500 mt-1">AI verification & compatibility insights</p></div><button type="button" onClick={() => setActiveTab('matching')} className="text-sm font-bold text-blue-600">← Back to Shortlist</button></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6"><div className="rounded-3xl bg-gradient-to-br from-slate-950 to-blue-900 text-white p-7 shadow-xl"><span className="inline-flex rounded-full bg-white/10 border border-white/10 px-3 py-1 text-xs font-bold text-blue-200">✨ Microsoft Foundry AI Analysis</span><h3 className="text-xl font-black mt-5">Why this NGO is a strong match</h3><p className="text-blue-100/80 text-sm leading-7 mt-3">{selectedNgo.why_this_ngo || `${selectedNgo.ngo_name} demonstrates strong alignment with your ${domain} requirement in ${location}.`}</p></div><div className="bg-white border border-slate-200 rounded-3xl p-7 shadow-sm"><h3 className="text-lg font-black text-slate-950 mb-6">Compatibility Breakdown</h3>{[['Overall Compatibility', selectedNgo.match_score, 'bg-emerald-500'], ['Impact Potential', selectedNgo.impact_score, 'bg-blue-600'], ['Budget Fit', selectedNgo.budget_fit, 'bg-indigo-600']].map(([label, value, bar]) => <div key={label as string} className="mb-6 last:mb-0"><div className="flex justify-between text-sm font-bold mb-2"><span>{label}</span><span>{value}{label === 'Overall Compatibility' ? '%' : '/100'}</span></div><div className="h-3 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${bar} rounded-full`} style={{ width: `${Math.min(100, Number(value))}%` }} /></div></div>)}</div></div>
              <div className="space-y-6"><div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm"><h3 className="font-black text-lg mb-4">Project Summary</h3><div className="space-y-3 text-sm"><div className="flex justify-between gap-4"><span className="text-slate-400">Project</span><span className="font-bold text-right">{projectName}</span></div><div className="flex justify-between"><span className="text-slate-400">Budget</span><span className="font-bold">₹{Number(budget).toLocaleString('en-IN')}</span></div><div className="flex justify-between"><span className="text-slate-400">Deadline</span><span className="font-bold">{formatDate(deadline)}</span></div></div></div><div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm"><h3 className="font-black text-lg mb-4">Due-Diligence Status</h3><div className="space-y-3">{['12A Registration', '80G Certificate', 'CSR-1 Filing'].map((item) => <div key={item} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"><span className="text-sm text-slate-600">{item}</span><span className="rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1 text-xs font-bold">✓ Verified</span></div>)}</div><p className="text-xs text-slate-400 mt-4 leading-5">Final governance approval remains with the company&apos;s CSR Committee.</p></div><button type="button" onClick={() => alert(`Invitation sent to ${selectedNgo.ngo_name} for competitive tender evaluation!`)} className="w-full bg-slate-950 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl shadow-lg transition">Invite to CSR Tender 🚀</button></div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
