import {Source,Locale} from './types';
import {searchSources,verseSource,retrieve,normalize,duas,hadith} from './sources';
import catalog from '@/data/catalog.json';
import tafsirEditions from '@/data/tafsirs.json';
import kalmas from '@/data/kalmas.json';
export {catalog,tafsirEditions};
type Reader=<T=any>(path:string)=>Promise<T|null>;
export function corpus(reader:Reader){
async function source(id:string):Promise<Source|null>{
 if(id.startsWith('kalma:'))return kalmas.find(s=>s.id===id) as Source||null;
 const q=id.match(/^(quran|dua):(\d+):(\d+)$/);if(q){const s=verseSource(+q[2],+q[3]);return s?{...s,id,kind:q[1] as 'quran'|'dua'}:null;}
 if(id.startsWith('dua:hisn:'))return duas.find(s=>s.id===id)||null;
 const h=id.match(/^hadith:(bukhari|muslim|abudawud|tirmidhi|nasai|ibnmajah):(\d+(?:\.\d+)?)$/);if(h){const rows=await reader<Source[]>(`hadith/${h[1]}/${Math.floor(Number(h[2])/100)}.json`);return rows?.find(s=>s.id===id)||null;}
 const t=id.match(/^tafsir:([a-z-]+):(\d+):(\d+)$/);if(t){const edition=tafsirEditions.find(e=>e.slug===t[1]);if(!edition||!verseSource(+t[2],+t[3]))return null;const data=await reader<any>(`tafsir/${t[1]}/${t[2]}.json`);const text=data?.texts[data.ayahs[t[3]]];if(!text)return null;return {id,kind:'tafsir',title:`${edition.name} ${t[2]}:${t[3]}`,arabic:edition.language==='ar'?text:'',en:edition.language==='en'?text:'',ur:edition.language==='ur'?text:undefined,url:`/tafsir/${t[1]}/${t[2]}/${t[3]}`,sourceUrl:edition.source,surah:+t[2],ayah:+t[3],textLanguage:edition.language as Locale,edition:edition.name};}
 return null;
}
async function tafsirs(s:number,a:number,language?:string){const candidates=tafsirEditions.filter(e=>!language||e.language===language);return (await Promise.all(candidates.map(e=>source(`tafsir:${e.slug}:${s}:${a}`)))).filter(Boolean) as Source[];}
async function search(query:string,kind='all',limit=60):Promise<Source[]>{
 const exact=query.trim().match(/^(?:sahih\s+)?(bukhari|muslim|abudawud|tirmidhi|nasai|ibnmajah)[\s:#]+(\d+(?:\.\d+)?)$/i);if(exact){const s=await source(`hadith:${exact[1].toLowerCase()}:${exact[2]}`);return s?[s]:[];}
 const local=kind==='hadith'||kind==='tafsir'?[]:searchSources(query,Math.max(limit,100)).filter(s=>s.kind!=='hadith'&&(kind==='all'||s.kind===kind));
 if(kind==='quran'||kind==='dua')return local;
 const tokens=[...new Set(normalize(query).match(/[^\W_]{2,}|[\u0600-\u06ff]{2,}/gu)||[])].filter(x=>!['the','and','what','does','about','explain','find','hadith','quran','میں','کے','کی','عن','من','في','قال','الله'].includes(x)).slice(0,8);
 if(!tokens.length)return local;
 const buckets=[...new Set(tokens.map(t=>[...t].reduce((n,c)=>n+c.charCodeAt(0),0)%256))];const loaded=await Promise.all(buckets.map(n=>reader<Record<string,number[]>>(`search/${n}.json`)));const scores=new Map<number,number>();for(const token of tokens){const idx=buckets.indexOf([...token].reduce((n,c)=>n+c.charCodeAt(0),0)%256);for(const id of loaded[idx]?.[token]||[])scores.set(id,(scores.get(id)||0)+1);}
 const ids=await reader<string[]>('search/ids.json');if(!ids)return local;const ranked=[...scores.entries()].filter(([id,score])=>score>=Math.max(1,Math.ceil(tokens.length*.5))&&(kind==='all'||ids[id]?.startsWith(kind+':'))).sort((a,b)=>b[1]-a[1]);const selected=kind==='all'?[...ranked.filter(([id])=>ids[id].startsWith('hadith:')).slice(0,20),...ranked.filter(([id])=>ids[id].startsWith('tafsir:')).slice(0,12)]:ranked.slice(0,Math.min(limit,40));const found:Source[]=[];
 // Bounded batches avoid loading many long tafsir files simultaneously.
 for(let i=0;i<selected.length;i+=4){const rows=await Promise.all(selected.slice(i,i+4).map(([id])=>source(ids[id])));found.push(...rows.filter(Boolean) as Source[]);}
 const seen=new Set<string>();return [...(kind==='all'?[...local.filter(s=>s.kind==='quran').slice(0,24),...local.filter(s=>s.kind==='dua').slice(0,12)]:local),...found].filter(s=>{if(seen.has(s.id))return false;seen.add(s.id);return true}).slice(0,limit);
}
async function collectionPage(col:string,book?:string,page=1){const c=catalog.find(c=>c.id===col);if(!c)return null;const entries=(book?c.books.filter(b=>b.id===book):c.books).flatMap(b=>b.ids);const start=(page-1)*20;const records=(await Promise.all(entries.slice(start,start+20).map(id=>source(`hadith:${col}:${id}`)))).filter(Boolean) as Source[];return {collection:c,records,total:entries.length,page,pages:Math.max(1,Math.ceil(entries.length/20))};}
async function retrieveFull(question:string,context:string|undefined,mode:string,language:Locale){const selected=context?await source(context):null;let sources:Source[]=[];if(selected)sources.push(selected);
 const raw=retrieve(question);sources.push(...raw.filter(s=>s.kind!=='hadith'));const clean=question.replace(/\b(what|does|the|say|about|find|explain|which|discusses|please|give|verses|mean|meaning|is|in|urdu|english|me)\b/gi,' ').replace(/(?:کے بارے میں|کی وضاحت کریں|تلاش کریں|ما معنى|اشرح|أعطني)/g,' ').trim();
 if(mode==='tafsir'||mode==='explain'||selected?.kind==='quran'){const first=sources.find(s=>s.surah&&s.ayah);if(first)sources.push(...await tafsirs(first.surah!,first.ayah!,language));}
 sources.push(...await search(clean,mode==='hadith'?'hadith':mode==='tafsir'?'tafsir':'all',8));const ids=new Set<string>();return sources.filter(s=>{if(ids.has(s.id))return false;if(mode==='hadith'&&s.kind!=='hadith')return false;if(mode==='tafsir'&&s.kind!=='tafsir')return false;ids.add(s.id);return true}).slice(0,10);
}
return {source,search,tafsirs,collectionPage,retrieve:retrieveFull};
}
