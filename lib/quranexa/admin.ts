import {identity} from './server';

// Explicit site-scoped user IDs only. Never promote the first visitor or trust email.
export async function adminIdentity(){const id=await identity();return id&&String(process.env.QURANEXA_ADMIN_IDS||'').split(',').map(s=>s.trim()).filter(Boolean).includes(id)?id:null;}
