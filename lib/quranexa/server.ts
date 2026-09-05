import {headers} from 'next/headers';

/**
 * Quranexa's original ChatGPT Sites build used a Cloudflare D1 binding.
 * Vercel does not provide that binding. Keep the database boundary explicit so
 * unauthenticated reading/chat paths can run normally while account-only
 * persistence fails closed until a persistent database is configured.
 */
export function database(): any {
  throw new Error('Quranexa persistent database is not configured on this deployment.');
}

export async function identity(){return (await headers()).get('oai-authenticated-user-id');}
export function sameOrigin(req:Request){const origin=req.headers.get('origin');return !origin||origin===new URL(req.url).origin;}
export function fail(status=500){return Response.json({error:'Quranexa couldn’t complete this request. Please try again.'},{status});}
