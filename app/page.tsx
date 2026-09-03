'use client';

import { useState } from 'react';
import mockData from './mockData.json';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'matching'>('dashboard');

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 text-white font-bold px-3 py-1.5 rounded-lg text-lg">IB</div>
          <span className="text-xl font-extrabold tracking-tight text-slate-900">ImpactBridge</span>
        </div>
        <div className="text-sm font-medium text-slate-500">
          Microsoft Innovation Club Wildcard Hackathon 🚀
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-8 py-8">
        
        {/* Header section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Corporate CSR Dashboard</h1>
            <p className="text-slate-500 mt-1">Discover, qualify, and select verified NGO implementation partners.</p>
          </div>
          <button 
            onClick={() => setActiveTab('matching')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all flex items-center space-x-2"
          >
            <span>+ Create CSR Initiative</span>
          </button>
        </div>

        {/* Top Metric Cards */}
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

        {/* Conditional View: Dashboard vs Matching Results */}
        {activeTab === 'dashboard' ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Ready to match your next initiative?</h3>
            <p className="text-slate-500 max-w-md mx-auto mb-6">
              Click the &quot;Create CSR Initiative&quot; button above to input your project requirements and see our AI matching engine score the best NGOs.
            </p>
            <button 
              onClick={() => setActiveTab('matching')}
              className="bg-slate-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-slate-800 transition-all"
            >
              Get Started with Partner Discovery
            </button>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Recommended NGO Shortlist</h2>
              <button 
                onClick={() => setActiveTab('dashboard')}
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                ← Back to Dashboard
              </button>
            </div>

            {/* NGO Cards List */}
            <div className="grid grid-cols-1 gap-4">
              {mockData.map((ngo) => (
                <div key={ngo.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex items-center space-x-3">
                      <h3 className="text-xl font-bold text-slate-900">{ngo.name}</h3>
                      <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
                        {ngo.match_score}% Match
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      Domains: {ngo.domains.join(', ')} • Location Focus: {ngo.locations.join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3 w-full md:w-auto">
                    <div className="text-right hidden md:block">
                      <p className="text-xs text-slate-400">Impact Potential</p>
                      <p className="text-sm font-bold text-slate-700">{ngo.impact_potential}/100</p>
                    </div>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium w-full md:w-auto transition-all">
                      View Details & AI Insights
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}