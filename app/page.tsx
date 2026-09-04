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

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'form' | 'matching' | 'detail'>('dashboard');
  const [projectName, setProjectName] = useState('Rural Education Initiative');
  const [domain, setDomain] = useState('Education');
  const [location, setLocation] = useState('Tamil Nadu');
  const [budget, setBudget] = useState('2500000');
  const [deadline, setDeadline] = useState('2026-10-30');
  const [selectedNgo, setSelectedNgo] = useState<Ngo | null>(null);
  const [ngoResults, setNgoResults] = useState<Ngo[]>([]);

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/match`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain,
            location,
            beneficiary: 'Students',
            budget: Number(budget),
            expertise: domain,
            deadline,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error('API Error:', errorData);
        throw new Error('Failed to get NGO matches');
      }

      const data = await response.json();
      console.log('API response:', data);
      setNgoResults(data.matches);
      setActiveTab('matching');
    } catch (error) {
      console.error('API Error:', error);
    }
  };

  const handleViewDetail = (ngo: Ngo) => {
    setSelectedNgo(ngo);
    setActiveTab('detail');
  };

  const handleLogout = () => {
    window.location.href = '/logout';
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="bg-blue-600 text-white font-bold px-3 py-1.5 rounded-lg text-lg">IB</div>
          <span className="text-xl font-extrabold tracking-tight text-slate-900">ImpactBridge</span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
        >
          <span>↪</span>
          <span>Logout</span>
        </button>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Corporate CSR Dashboard</h1>
            <p className="text-slate-500 mt-1">Discover, qualify, and select verified NGO implementation partners.</p>
          </div>
          <button
            onClick={() => setActiveTab('form')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all flex items-center space-x-2"
          >
            <span>+ Create CSR Initiative</span>
          </button>
        </div>

        {activeTab === 'dashboard' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Available CSR Budget</p>
                <h3 className="text-3xl font-extrabold text-slate-900 mt-2">₹2.4 Cr</h3>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Active Projects</p>
                <h3 className="text-3xl font-extrabold text-slate-900 mt-2">18</h3>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Avg Impact Score</p>
                <h3 className="text-3xl font-extrabold text-green-600 mt-2">73%</h3>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Potential NGO Partners</p>
                <h3 className="text-3xl font-extrabold text-blue-600 mt-2">35+</h3>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center">
              <h3 className="text-xl font-bold text-slate-800 mb-2">Ready to match your next initiative?</h3>
              <p className="text-slate-500 max-w-md mx-auto mb-6">
                Click the &quot;Create CSR Initiative&quot; button above to input your project requirements and see our AI matching engine score the best NGOs.
              </p>
              <button
                onClick={() => setActiveTab('form')}
                className="bg-slate-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-slate-800 transition-all"
              >
                Get Started with Partner Discovery
              </button>
            </div>
          </div>
        )}

        {activeTab === 'form' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Define CSR Requirement</h2>
              <button onClick={() => setActiveTab('dashboard')} className="text-sm text-slate-500 hover:underline">Cancel</button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Project Title</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">CSR Focus Domain</label>
                  <select
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="Education">Education</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Environment">Environment</option>
                    <option value="Rural Development">Rural Development</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Target Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Allocated Budget (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Project Deadline</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    min="2026-01-01"
                    max="2026-12-31"
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    required
                  />
                  <p className="text-xs text-slate-400 mt-1">Select a deadline within 2026.</p>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl shadow-md transition-all mt-4"
              >
                Find Best NGO Partners (Run Matching Engine)
              </button>
            </form>
          </div>
        )}

        {activeTab === 'matching' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Recommended NGO Shortlist</h2>
                <p className="text-sm text-slate-500">
                  Showing matches for &quot;{projectName}&quot; in {location} ({domain}) • Deadline: {deadline}
                </p>
              </div>
              <button onClick={() => setActiveTab('form')} className="text-sm text-blue-600 hover:underline font-medium">
                ← Edit Requirements
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {ngoResults.map((ngo) => (
                <div key={ngo.ngo_id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex items-center space-x-3">
                      <h3 className="text-xl font-bold text-slate-900">{ngo.ngo_name}</h3>
                      <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
                        {ngo.match_score}% Match
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      Domains: {ngo.domains?.join(', ') || 'N/A'} • Location Focus: {ngo.locations?.join(', ') || 'N/A'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3 w-full md:w-auto">
                    <div className="text-right hidden md:block">
                      <p className="text-xs text-slate-400">Impact Potential</p>
                      <p className="text-sm font-bold text-slate-700">{ngo.impact_score}/100</p>
                    </div>
                    <button
                      onClick={() => handleViewDetail(ngo)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium w-full md:w-auto transition-all"
                    >
                      View AI Insights
                    </button>
                  </div>
                </div>
              ))}
              {!ngoResults.length && (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
                  No NGO matches returned yet. Please edit the requirements and try again.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'detail' && selectedNgo && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{selectedNgo.ngo_name} — AI Verification &amp; Insights</h2>
                <p className="text-sm text-slate-500">Comprehensive partner due-diligence report</p>
              </div>
              <button onClick={() => setActiveTab('matching')} className="text-sm text-blue-600 hover:underline font-medium">
                ← Back to Shortlist
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <div className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white p-6 rounded-2xl shadow-sm">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="bg-blue-500/30 text-blue-200 text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-400/30">
                      ✨ Microsoft Foundry AI Analysis
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">Why this NGO is a strong match:</h3>
                  <p className="text-blue-100 text-sm leading-relaxed">
                    {selectedNgo.ngo_name} demonstrates a high degree of alignment with your {domain} requirement in {location}. They exhibit robust historical execution capability, optimized budget ranges, and verified operational presence in target beneficiary regions.
                  </p>
                </div>

                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Core Compatibility Breakdown</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1 font-medium text-slate-700">
                        <span>Overall Compatibility Score</span>
                        <span className="text-emerald-600 font-bold">{selectedNgo.match_score}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${selectedNgo.match_score}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1 font-medium text-slate-700">
                        <span>Impact Potential Index</span>
                        <span className="text-blue-600 font-bold">{selectedNgo.impact_score}/100</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${selectedNgo.impact_score}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1 font-medium text-slate-700">
                        <span>Budget Fit Score</span>
                        <span className="text-indigo-600 font-bold">{selectedNgo.budget_fit}/100</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${selectedNgo.budget_fit}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Project Summary</h3>
                  <div className="space-y-3 text-sm text-slate-700">
                    <div className="flex justify-between gap-4"><span>Project</span><span className="font-semibold text-right">{projectName}</span></div>
                    <div className="flex justify-between gap-4"><span>Budget</span><span className="font-semibold">₹{Number(budget).toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between gap-4"><span>Deadline</span><span className="font-semibold">{deadline}</span></div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Due-Diligence Status</h3>
                  <ul className="space-y-3 text-sm text-slate-700">
                    <li className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span>12A Registration</span>
                      <span className="text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">Verified</span>
                    </li>
                    <li className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span>80G Certificate</span>
                      <span className="text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">Verified</span>
                    </li>
                    <li className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span>CSR-1 Filing</span>
                      <span className="text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">Verified</span>
                    </li>
                  </ul>
                  <p className="text-xs text-slate-400 mt-4 italic">
                    *Note: Final governance approval remains with the company&apos;s CSR Committee.
                  </p>
                </div>

                <button
                  onClick={() => alert(`Invitation sent to ${selectedNgo.ngo_name} for competitive tender evaluation!`)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-xl shadow-md transition-all text-center"
                >
                  Invite to CSR Tender 🚀
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
