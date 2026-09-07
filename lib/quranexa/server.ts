import {headers} from 'next/headers';

export function database(): any {
  throw new Error('Quran - Exa persistent legacy database is not configured on this deployment.');
}

export async function identity(req?:Request){
  if(req){
    const token=req.headers.get('authorization')?.replace(/^Bearer\s+/i,'').trim();
    const key=process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if(token&&key){
      try{const response=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(key)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({idToken:token}),cache:'no-store'});if(response.ok){const data=await response.json();const user=data.users?.[0];if(user?.localId)return String(user.localId)}}catch{}
    }
  }
  return (await headers()).get('oai-authenticated-user-id');
}
export function sameOrigin(req:Request){const origin=req.headers.get('origin');return !origin||origin===new URL(req.url).origin;}
export function fail(status=500){return Response.json({error:'Quran - Exa couldn’t complete this request. Please try again.'},{status});}
