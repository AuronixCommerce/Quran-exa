import {NextResponse} from 'next/server';
import {chatAdminDatabase,verifyFirebaseRequest} from '@/lib/quranexa/firebase-admin';

type SavedChat={id:string;kind:string;value:unknown;updatedAt:number};

const safe=(id:string)=>encodeURIComponent(id).replace(/\./g,'%2E');

function fail(error:unknown){
  const message=error instanceof Error?error.message:'';
  if(message==='UNAUTHORIZED'||message.includes('auth/id-token')){
    return NextResponse.json({error:'Quran - Exa Auth: Please sign in again.'},{status:401});
  }
  if(message.startsWith('Missing server configuration:')){
    return NextResponse.json({error:'Quran - Exa chat sync is not configured yet.'},{status:503});
  }
  return NextResponse.json({error:'Quran - Exa could not sync chats. Please try again.'},{status:500});
}

function normalize(input:any):SavedChat|null{
  if(!input||typeof input!=='object')return null;
  const id=String(input.id||'').trim();
  if(!id.startsWith('chat:')||id.length>180)return null;
  const raw=JSON.stringify(input.value??null);
  if(raw.length>1_500_000)return null;
  return {id,kind:'chat',value:input.value??null,updatedAt:Number(input.updatedAt)||Date.now()};
}

export async function GET(req:Request){
  try{
    const decoded=await verifyFirebaseRequest(req);
    const snap=await chatAdminDatabase().ref(`users/${decoded.uid}/chats`).get();
    const value=snap.val()||{};
    const items=(Object.values(value) as SavedChat[]).filter(Boolean).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
    return NextResponse.json({items});
  }catch(error){
    return fail(error);
  }
}

export async function POST(req:Request){
  try{
    const decoded=await verifyFirebaseRequest(req);
    const body=await req.json().catch(()=>({}));
    const root=chatAdminDatabase().ref(`users/${decoded.uid}/chats`);

    if(Array.isArray(body.items)){
      const normalized=body.items.slice(0,250).map(normalize).filter(Boolean) as SavedChat[];
      if(!normalized.length)return NextResponse.json({ok:true,merged:0});
      const existing=(await root.get()).val()||{};
      const patch:Record<string,SavedChat>={};
      for(const item of normalized){
        const key=safe(item.id);
        if(!body.mergeOnly||!existing[key])patch[key]=item;
      }
      if(Object.keys(patch).length)await root.update(patch);
      return NextResponse.json({ok:true,merged:Object.keys(patch).length});
    }

    const item=normalize(body.item);
    if(!item)return NextResponse.json({error:'Invalid chat payload.'},{status:400});
    await root.child(safe(item.id)).set(item);
    return NextResponse.json({ok:true});
  }catch(error){
    return fail(error);
  }
}

export async function DELETE(req:Request){
  try{
    const decoded=await verifyFirebaseRequest(req);
    const body=await req.json().catch(()=>({}));
    const id=String(body.id||'').trim();
    if(!id.startsWith('chat:')||id.length>180)return NextResponse.json({error:'Invalid chat id.'},{status:400});
    await chatAdminDatabase().ref(`users/${decoded.uid}/chats/${safe(id)}`).remove();
    return NextResponse.json({ok:true});
  }catch(error){
    return fail(error);
  }
}
