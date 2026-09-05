const maxAge=31536000;
const limit=10;

export type GuestVisitor={id:string;rawId:string;count:number;cookie:string};

function secret(){return process.env.GUEST_QUOTA_SECRET||process.env.GROQ_API_KEY||'quranexa-local-quota';}
async function mac(value:string){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret()),{name:'HMAC',hash:'SHA-256'},false,['sign']);return [...new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value)))].map(n=>n.toString(16).padStart(2,'0')).join('');}
async function cookieFor(id:string,count:number){const value=`${id}.${count}`;return `quranexa_guest=${value}.${await mac(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;}

export async function guest(req:Request):Promise<GuestVisitor>{
 const token=req.headers.get('cookie')?.match(/(?:^|;\s*)quranexa_guest=([a-f0-9-]{36})\.(\d{1,2})\.([a-f0-9]{64})/)||null;
 let rawId=token?.[1]||'';let count=Number(token?.[2]||0);const signature=token?.[3]||'';
 const value=`${rawId}.${count}`;const valid=rawId.length===36&&Number.isInteger(count)&&count>=0&&count<=limit&&signature===await mac(value);
 if(!valid){rawId=crypto.randomUUID();count=0;}
 return {id:`guest:${rawId}`,rawId,count,cookie:await cookieFor(rawId,count)};
}

export function remaining(visitor:GuestVisitor){return Math.max(0,limit-visitor.count);}
export async function reserveGuest(visitor:GuestVisitor){if(visitor.count>=limit)return null;const count=visitor.count+1;return {remaining:Math.max(0,limit-count),cookie:await cookieFor(visitor.rawId,count)};}
