import { NextResponse } from 'next/server';
import { addQuote, createTender, getQuotes, getTender, listTenders, optimizeQuotes, selectQuote, UserRole } from '@/lib/tender-store';

function context(request: Request) {
  const role = request.headers.get('x-user-role') as UserRole | null;
  const email = request.headers.get('x-user-email')?.trim().toLowerCase() || '';
  if ((role !== 'CSR' && role !== 'NGO') || !email) return null;
  return { role, email };
}

export async function GET(request: Request) {
  const user = context(request);
  if (!user) return NextResponse.json({ detail: 'Role and user email are required.' }, { status: 401 });
  const tenderId = new URL(request.url).searchParams.get('tenderId');
  if (tenderId) {
    const tender = getTender(tenderId);
    if (!tender || (user.role === 'CSR' ? tender.createdBy !== user.email : !tender.invitedNgos.includes(user.email))) return NextResponse.json({ detail: 'Tender not found.' }, { status: 404 });
    return NextResponse.json({ tender, quotes: user.role === 'CSR' ? getQuotes(tenderId) : [] });
  }
  return NextResponse.json({ tenders: listTenders(user.role, user.email) });
}

export async function POST(request: Request) {
  const user = context(request);
  if (!user) return NextResponse.json({ detail: 'Role and user email are required.' }, { status: 401 });
  const body = await request.json();

  if (body.action === 'create') {
    if (user.role !== 'CSR') return NextResponse.json({ detail: 'Only CSR users can create tenders.' }, { status: 403 });
    const tender = createTender({ title: String(body.title || ''), description: String(body.description || ''), domain: String(body.domain || ''), location: String(body.location || ''), budget: Number(body.budget || 0), deadline: String(body.deadline || ''), invitedNgos: Array.isArray(body.invitedNgos) ? body.invitedNgos.map(String) : [], createdBy: user.email });
    return NextResponse.json({ tender }, { status: 201 });
  }

  if (body.action === 'quote') {
    const tender = getTender(String(body.tenderId));
    if (user.role !== 'NGO' || !tender || !tender.invitedNgos.includes(user.email)) return NextResponse.json({ detail: 'You are not allowed to quote on this tender.' }, { status: 403 });
    const quote = addQuote({ tenderId: tender.id, ngoEmail: user.email, ngoName: String(body.ngoName || user.email), amount: Number(body.amount || 0), timelineDays: Number(body.timelineDays || 0), proposal: String(body.proposal || '') });
    return NextResponse.json({ quote }, { status: 201 });
  }

  if (body.action === 'optimize' || body.action === 'select') {
    const tender = getTender(String(body.tenderId));
    if (user.role !== 'CSR' || !tender || tender.createdBy !== user.email) return NextResponse.json({ detail: 'Only the tender owner can evaluate quotations.' }, { status: 403 });
    if (body.action === 'optimize') return NextResponse.json({ recommendation: optimizeQuotes(tender.id) });
    const selected = selectQuote(tender.id, String(body.quoteId));
    if (!selected) return NextResponse.json({ detail: 'Quote not found.' }, { status: 404 });
    return NextResponse.json({ selected });
  }

  return NextResponse.json({ detail: 'Unknown tender action.' }, { status: 400 });
}
