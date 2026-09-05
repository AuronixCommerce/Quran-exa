'use client';
import {createContext,useContext,useState,useEffect,ReactNode} from 'react';
import {toast,Toaster} from 'sonner';
import {Locale,Preferences,Saved} from '@/lib/quranexa/types';
import {dictionary} from '@/lib/quranexa/i18n';
const defaults:Preferences={translation:'en',aiLanguage:'en',fontSize:34,translationSize:17,theme:'light',readingMode:'both',arabicFont:'serif',name:''};
type Context={locale:Locale;d:ReturnType<typeof dictionary>;prefs:Preferences;setPrefs:(v:Preferences)=>void;items:Saved[];signedIn:boolean;ready:boolean;save:(id:string,kind:string,value:any)=>Promise<boolean>;remove:(id:string)=>Promise<boolean>};
const State=createContext<Context>(null!);
export function Provider({locale,user,children}:{locale:Locale;user:boolean;children:ReactNode}){const [prefs,setPrefs]=useState<Preferences>({...defaults,translation:locale==='ur'?'ur':'en',aiLanguage:locale});const [items,setItems]=useState<Saved[]>([]),[signedIn,setSignedIn]=useState(user),[ready,setReady]=useState(false);const d=dictionary(locale);
useEffect(()=>{let active=true;fetch('/api/state').then(r=>{if(!r.ok)throw Error();return r.json()}).then(v=>{if(!active)return;setSignedIn(v.signedIn);setItems(v.items);const saved=v.items.find((x:Saved)=>x.kind==='preferences');if(saved)setPrefs({...defaults,...saved.value});}).catch(()=>toast.error(d.tryAgain)).finally(()=>{if(active)setReady(true)});return()=>{active=false}},[]);
useEffect(()=>{document.documentElement.lang=locale;document.documentElement.dir=locale==='en'?'ltr':'rtl';document.documentElement.classList.toggle('dark',prefs.theme==='dark');},[locale,prefs.theme]);
async function save(id:string,kind:string,value:any){if(!signedIn){toast(d.guest);return false}try{const r=await fetch('/api/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,kind,value:kind==='bookmark'?{id:value.id}:kind==='chat'?{...value,context:value.context?{id:value.context.id}:null,turns:value.turns.map((t:any)=>({...t,sources:t.sources?.map((s:any)=>({id:s.id})),answer:t.answer?{...t.answer,sources:t.answer.sources.map((s:any)=>({id:s.id}))}:undefined}))}:value})});if(!r.ok)throw Error();setItems(old=>[{id,kind,value,updatedAt:Date.now()},...old.filter(x=>x.id!==id)]);return true}catch{toast.error(d.tryAgain);return false}}
async function remove(id:string){try{const r=await fetch('/api/state?id='+encodeURIComponent(id),{method:'DELETE'});if(!r.ok)throw Error();setItems(old=>old.filter(x=>x.id!==id));return true}catch{toast.error(d.tryAgain);return false}}
return <State.Provider value={{locale,d,prefs,setPrefs,items,signedIn,ready,save,remove}}>{children}<Toaster position="bottom-center" richColors dir={locale==='en'?'ltr':'rtl'}/></State.Provider>}
export const useQ=()=>useContext(State);
