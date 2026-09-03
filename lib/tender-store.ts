export type UserRole = 'CSR' | 'NGO';

export interface Tender {
  id: string;
  title: string;
  description: string;
  domain: string;
  location: string;
  budget: number;
  deadline: string;
  invitedNgos: string[];
  createdBy: string;
  createdAt: string;
  status: 'OPEN' | 'AWARDED' | 'CLOSED';
  selectedQuoteId?: string;
}

export interface Quote {
  id: string;
  tenderId: string;
  ngoEmail: string;
  ngoName: string;
  amount: number;
  timelineDays: number;
  proposal: string;
  submittedAt: string;
  status: 'SUBMITTED' | 'SELECTED' | 'REJECTED';
}

// Runtime-only store. No existing database/login schema is touched.
const tenders = new Map<string, Tender>();
const quotes = new Map<string, Quote>();

const id = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export function createTender(input: Omit<Tender, 'id' | 'createdAt' | 'status'>) {
  const tender: Tender = { ...input, id: id('tender'), createdAt: new Date().toISOString(), status: 'OPEN' };
  tenders.set(tender.id, tender);
  return tender;
}

export function listTenders(role: UserRole, email: string) {
  return [...tenders.values()].filter((tender) => role === 'CSR' ? tender.createdBy === email : tender.invitedNgos.includes(email));
}

export function getTender(tenderId: string) { return tenders.get(tenderId); }

export function addQuote(input: Omit<Quote, 'id' | 'submittedAt' | 'status'>) {
  const quote: Quote = { ...input, id: id('quote'), submittedAt: new Date().toISOString(), status: 'SUBMITTED' };
  quotes.set(quote.id, quote);
  return quote;
}

export function getQuotes(tenderId: string) { return [...quotes.values()].filter((quote) => quote.tenderId === tenderId); }

export function selectQuote(tenderId: string, quoteId: string) {
  const tender = tenders.get(tenderId);
  const selected = quotes.get(quoteId);
  if (!tender || !selected || selected.tenderId !== tenderId) return null;
  getQuotes(tenderId).forEach((quote) => { quote.status = quote.id === quoteId ? 'SELECTED' : 'REJECTED'; });
  tender.selectedQuoteId = quoteId;
  tender.status = 'AWARDED';
  return selected;
}

export function optimizeQuotes(tenderId: string) {
  const available = getQuotes(tenderId);
  if (!available.length) return null;
  // Balanced score: 60% cost + 40% delivery speed. Lower is better.
  const minCost = Math.min(...available.map((q) => q.amount));
  const maxCost = Math.max(...available.map((q) => q.amount));
  const minDays = Math.min(...available.map((q) => q.timelineDays));
  const maxDays = Math.max(...available.map((q) => q.timelineDays));
  const normalize = (value: number, min: number, max: number) => max === min ? 1 : (max - value) / (max - min);
  const ranked = available.map((quote) => ({
    quote,
    optimizationScore: Math.round((normalize(quote.amount, minCost, maxCost) * 60 + normalize(quote.timelineDays, minDays, maxDays) * 40) * 100) / 100,
  })).sort((a, b) => b.optimizationScore - a.optimizationScore);
  return ranked[0];
}
