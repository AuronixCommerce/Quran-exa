import {guest,remaining} from '@/lib/quranexa/guest';import {fail} from '@/lib/quranexa/server';
export async function GET(req:Request){try{const g=await guest(req);return Response.json({remaining:remaining(g),limit:10},{headers:{'Set-Cookie':g.cookie,'Cache-Control':'private,no-store'}})}catch{return fail(503)}}
