import {env} from 'cloudflare:workers';
import {headers} from 'next/headers';
export function database(){const db=(env as any).DB;if(!db)throw new Error('unavailable');return db;}
export async function identity(){return (await headers()).get('oai-authenticated-user-id');}
export function sameOrigin(req:Request){const origin=req.headers.get('origin');return !origin||origin===new URL(req.url).origin;}
export function fail(status=500){return Response.json({error:'Quranexa couldn’t complete this request. Please try again.'},{status});}
