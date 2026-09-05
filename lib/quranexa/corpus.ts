import {env} from 'cloudflare:workers';
import {corpus} from './corpus-core';
const cache=new Map<string,{value:any;bytes:number}>();const pending=new Map<string,Promise<any>>();let size=0;
async function read<T=any>(path:string):Promise<T|null>{const cached=cache.get(path);if(cached){cache.delete(path);cache.set(path,cached);return cached.value;}
if(pending.has(path))return pending.get(path)!;const task=(async()=>{const response=await (env as any).ASSETS.fetch(new Request('https://quranexa-assets.invalid/corpus/'+path));if(!response.ok)return null;const raw=await response.text();const value=JSON.parse(raw);if(raw.length<4000000){while(cache.size>=12||size+raw.length>8000000){const k=cache.keys().next().value;if(!k)break;size-=cache.get(k)!.bytes;cache.delete(k)}cache.set(path,{value,bytes:raw.length});size+=raw.length;}return value;})();pending.set(path,task);try{return await task}finally{pending.delete(path)}}
export const library=corpus(read);
