import {env} from 'cloudflare:workers';
import {database} from './server';
const maxAge=31536000;
async function mac(value:string){const secret=(env as any).GUEST_QUOTA_SECRET;if(!secret)throw Error('unavailable');const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return [...new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value)))].map(n=>n.toString(16).padStart(2,'0')).join('');}
export async function guest(req:Request){const token=req.headers.get('cookie')?.match(/(?:^|;\s*)quranexa_guest=([a-f0-9-]+\.[a-f0-9]+)/)?.[1];let id=token?.split('.')[0];if(!id||id.length!==36||token!==`${id}.${await mac(id)}`)id=crypto.randomUUID();const signed=`${id}.${await mac(id)}`;return {id:`guest:${id}`,cookie:`quranexa_guest=${signed}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`};}
export async function remaining(id:string){const r=await database().prepare('SELECT count FROM ai_limits WHERE key=?').bind(id).first();return Math.max(0,10-(r?.count||0));}
export async function reserveGuest(id:string){const r=await database().prepare('INSERT INTO ai_limits (key,count,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 WHERE count<10 RETURNING count').bind(id,Date.now()+maxAge*1000).first();return r?10-r.count:null;}
