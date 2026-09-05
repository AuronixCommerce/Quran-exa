import {z} from 'zod';
import type {Source} from './types';
export const answerSchema=z.object({claims:z.array(z.object({text:z.string().min(1).max(1800),sourceIds:z.array(z.string()).min(1).max(6)})).min(1).max(12),suggestions:z.array(z.string().max(150)).max(3)}).strict();
export function validateAnswer(data:unknown,sources:Source[]){const parsed=answerSchema.safeParse(data);if(!parsed.success)return null;const allowed=new Set(sources.map(s=>s.id));for(const claim of parsed.data.claims){if(claim.sourceIds.some(id=>!allowed.has(id)))return null;const normalized=claim.text.replace(/[٠-٩۰-۹]/g,c=>String(c.charCodeAt(0)-(c.charCodeAt(0)>=1776?1776:1632)));const refs=[...normalized.matchAll(/\b(\d{1,3}):(\d{1,3})\b/g)];if(refs.some(r=>!claim.sourceIds.includes(`quran:${r[1]}:${r[2]}`)&&!claim.sourceIds.includes(`dua:${r[1]}:${r[2]}`)))return null;
if(/(?:bukhari|muslim|tirmidhi|daw[ou]+d|nasai|majah|بخاري|بخاری|مسلم|ترمذي|ترمذی)\s*(?:no\.?|number|#)?\s*\d+/i.test(normalized))return null;
// Quotations are rendered exclusively from immutable sources, never model output.
if(/["“”«»]/.test(claim.text)||/https?:\/\//i.test(claim.text))return null;
}return parsed.data;}
