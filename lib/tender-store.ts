import fs from 'fs';
import path from 'path';

export type UserRole = 'CSR' | 'NGO';
export interface Tender { id:string; title:string; description:string; domain:string; location:string; budget:number; deadline:string; invitedNgos:string[]; invitedCsrs:string[]; createdBy:string; createdByRole:UserRole; createdAt:string; status:'OPEN'|'AWARDED'|'CLOSED'; selectedQuoteId?:string; }
export interface Quote { id:string; tenderId:string; bidderEmail:string; bidderRole:UserRole; bidderName:string; amount:number; timelineDays:number; proposal:string; submittedAt:string; status:'SUBMITTED'|'SELECTED'|'REJECTED'; }
type StoredData={tenders:Tender[];quotes:Quote[]};
const dataFile=path.join(process.cwd(),'data','tenders.json');
function readStore():StoredData{try{const parsed=JSON.parse(fs.readFileSync(dataFile,'utf8'));return{tenders:Array.isArray(parsed.tenders)?parsed.tenders:[],quotes:Array.isArray(parsed.quotes)?parsed.quotes:[]};}catch{return{tenders:[],quotes:[]};}}
function writeStore(data:StoredData){fs.mkdirSync(path.dirname(dataFile),{recursive:true});const tmp=`${dataFile}.tmp`;fs.writeFileSync(tmp,JSON.stringify(data,null,2));fs.renameSync(tmp,dataFile);}
const id=(prefix:string)=>`${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
export function createTender(input:Omit<Tender,'id'|'createdAt'|'status'>){const data=readStore();const tender:Tender={...input,invitedNgos:input.invitedNgos||[],invitedCsrs:input.invitedCsrs||[],id:id('tender'),createdAt:new Date().toISOString(),status:'OPEN'};data.tenders.push(tender);writeStore(data);return tender;}
export function listTenders(role:UserRole,email:string){return readStore().tenders.filter(t=>role==='CSR'?(t.createdByRole==='CSR'?t.createdBy===email:t.status==='OPEN'):(t.createdByRole==='NGO'?t.createdBy===email:t.invitedNgos.includes(email)));}
export function getTender(tenderId:string){return readStore().tenders.find(t=>t.id===tenderId);}
export function addQuote(input:Omit<Quote,'id'|'submittedAt'|'status'>){const data=readStore();const quote:Quote={...input,id:id('quote'),submittedAt:new Date().toISOString(),status:'SUBMITTED'};data.quotes.push(quote);writeStore(data);return quote;}
export function getQuotes(tenderId:string){return readStore().quotes.filter(q=>q.tenderId===tenderId);}
export function selectQuote(tenderId:string,quoteId:string){const data=readStore();const tender=data.tenders.find(t=>t.id===tenderId);const selected=data.quotes.find(q=>q.id===quoteId);if(!tender||!selected||selected.tenderId!==tenderId)return null;data.quotes.forEach(q=>{if(q.tenderId===tenderId)q.status=q.id===quoteId?'SELECTED':'REJECTED';});tender.selectedQuoteId=quoteId;tender.status='AWARDED';writeStore(data);return selected;}
export function optimizeQuotes(tenderId:string){const available=getQuotes(tenderId);if(!available.length)return null;const minCost=Math.min(...available.map(q=>q.amount)),maxCost=Math.max(...available.map(q=>q.amount)),minDays=Math.min(...available.map(q=>q.timelineDays)),maxDays=Math.max(...available.map(q=>q.timelineDays));const normalize=(v:number,min:number,max:number)=>max===min?1:(max-v)/(max-min);return available.map(quote=>({quote,optimizationScore:Math.round((normalize(quote.amount,minCost,maxCost)*60+normalize(quote.timelineDays,minDays,maxDays)*40)*100)/100})).sort((a,b)=>b.optimizationScore-a.optimizationScore)[0];}
