'use client';

import {createContext,useContext,useEffect,useMemo,useState,ReactNode} from 'react';
import {onAuthStateChanged,signOut,User} from 'firebase/auth';
import {get,onValue,ref,remove as removeValue,set,update} from 'firebase/database';
import {toast,Toaster} from 'sonner';
import {Locale,Preferences,Saved} from '@/lib/quranexa/types';
import {dictionary} from '@/lib/quranexa/i18n';
import {auth,chatDb,firebaseReady,userDb} from '@/lib/quranexa/firebase';

const defaults:Preferences={translation:'en',aiLanguage:'en',fontSize:34,translationSize:17,theme:'light',readingMode:'both',arabicFont:'serif',name:''};
const LOCAL_KEY='quran-exa:guest-state:v2';
const safe=(id:string)=>encodeURIComponent(id).replace(/\./g,'%2E');
const clean=<T,>(value:T):T=>JSON.parse(JSON.stringify(value));
function localItems():Saved[]{if(typeof window==='undefined')return[];try{return JSON.parse(localStorage.getItem(LOCAL_KEY)||'[]')}catch{return[]}}
function writeLocal(items:Saved[]){try{localStorage.setItem(LOCAL_KEY,JSON.stringify(items.slice(0,250)))}catch{}}

type Context={locale:Locale;d:ReturnType<typeof dictionary>;prefs:Preferences;setPrefs:(v:Preferences)=>void;items:Saved[];signedIn:boolean;ready:boolean;user:User|null;profilePhoto:string;save:(id:string,kind:string,value:any)=>Promise<boolean>;remove:(id:string)=>Promise<boolean>;logout:()=>Promise<void>;saveProfilePicture:(dataUrl:string)=>Promise<boolean>};
const State=createContext<Context>(null!);

export function Provider({locale,children}:{locale:Locale;user?:boolean;children:ReactNode}){
  const [prefs,setPrefs]=useState<Preferences>({...defaults,translation:locale==='ur'?'ur':'en',aiLanguage:locale});
  const [mainItems,setMainItems]=useState<Saved[]>([]),[chatItems,setChatItems]=useState<Saved[]>([]),[guestItems,setGuestItems]=useState<Saved[]>([]);
  const [user,setUser]=useState<User|null>(null),[ready,setReady]=useState(false),[profilePhoto,setProfilePhoto]=useState('');
  const raw=dictionary(locale);
  const d=useMemo(()=>({...raw,
    brand:'Quran - Exa',
    ask:locale==='ur'?'Quran - Exa سے پوچھیں':locale==='ar'?'اسأل Quran - Exa':'Ask Quran - Exa',
    signIn:locale==='ur'?'داخل ہوں':locale==='ar'?'تسجيل الدخول':'Sign in',
    signOut:locale==='ur'?'کھاتے سے نکلیں':locale==='ar'?'تسجيل الخروج':'Sign out',
    guestChatNote:locale==='ur'?'مہمان گفتگو اسی براؤزر میں محفوظ رہتی ہے۔ داخل ہونے پر گفتگو آپ کے Quran - Exa کھاتے سے ہم آہنگ ہو جاتی ہے۔':locale==='ar'?'تُحفظ محادثات الضيف على هذا المتصفح، وعند تسجيل الدخول تُزامن مع حساب Quran - Exa.':'Guest chats are saved on this browser. Sign in to sync conversations with your Quran - Exa account.',
    googleUnavailable:locale==='ur'?'گوگل کے ذریعے داخلہ دستیاب ہے۔':locale==='ar'?'تسجيل الدخول عبر Google متاح.':'Google sign-in is available.',
    tryAgain:locale==='ur'?'Quran - Exa یہ درخواست مکمل نہیں کر سکا۔ دوبارہ کوشش کریں۔':locale==='ar'?'تعذر على Quran - Exa إكمال الطلب. حاول مرة أخرى.':'Quran - Exa couldn’t complete this request. Please try again.',
    noEvidence:locale==='ur'?'Quran - Exa کو قابلِ اعتماد حوالہ کافی مقدار میں نہیں ملا۔':locale==='ar'?'لم يجد Quran - Exa مصادر موثوقة كافية للإجابة بثقة.':'Quran - Exa couldn’t verify enough reliable sources to answer this confidently.',
    aiUnavailable:locale==='ur'?'Quran - Exa AI اس وقت دستیاب نہیں۔ قرآن اور ماخذ کا مطالعہ جاری رکھا جا سکتا ہے۔':locale==='ar'?'Quran - Exa AI غير متاح حاليًا. يمكنك متابعة القراءة والبحث.':'Quran - Exa AI is temporarily unavailable. You can still read and search the source library.',
    accountNote:locale==='ur'?'آپ کا Quran - Exa کھاتا آپ کی ترجیحات، محفوظ آیات اور مطالعے کی تاریخ ہم آہنگ کرتا ہے۔':locale==='ar'?'يزامن حساب Quran - Exa تفضيلاتك ومحفوظاتك وسجل القراءة.':'Your Quran - Exa account syncs preferences, bookmarks, reading history and chats.'
  }),[raw,locale]) as ReturnType<typeof dictionary>;
  const signedIn=!!user;
  const items=signedIn?[...chatItems,...mainItems]:guestItems;

  useEffect(()=>{setGuestItems(localItems());const cached=localItems().find(x=>x.kind==='preferences');if(cached)setPrefs({...defaults,...cached.value});},[]);

  useEffect(()=>{
    if(!firebaseReady){setReady(true);return;}
    let stopState=()=>{},stopChats=()=>{},stopProfile=()=>{};
    const stopAuth=onAuthStateChanged(auth,async current=>{
      stopState();stopChats();stopProfile();setUser(current);setMainItems([]);setChatItems([]);setProfilePhoto('');
      if(!current){setGuestItems(localItems());setReady(true);return;}
      const uid=current.uid;
      const guests=localItems().filter(x=>x.kind==='chat');
      if(guests.length){
        try{const root=ref(chatDb,`users/${uid}/chats`),existing=(await get(root)).val()||{},patch:Record<string,unknown>={};for(const item of guests){const key=safe(item.id);if(!existing[key])patch[key]=clean(item)}if(Object.keys(patch).length)await update(root,patch);}catch{}
      }
      stopState=onValue(ref(userDb,`users/${uid}/state`),snap=>{const value=snap.val()||{};const list=Object.values(value) as Saved[];setMainItems(list.sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0)));const saved=list.find(x=>x.kind==='preferences');if(saved)setPrefs({...defaults,...saved.value});},()=>toast.error(d.tryAgain));
      stopChats=onValue(ref(chatDb,`users/${uid}/chats`),snap=>{const value=snap.val()||{};const list=Object.values(value) as Saved[];setChatItems(list.sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0)));},()=>toast.error(d.tryAgain));
      stopProfile=onValue(ref(userDb,`users/${uid}/profile`),snap=>{const profile=snap.val()||{};setProfilePhoto(profile.photoDataUrl||'');if(profile.name)setPrefs(p=>({...p,name:profile.name}));});
      setReady(true);
    });
    return()=>{stopAuth();stopState();stopChats();stopProfile()};
  },[d.tryAgain]);

  useEffect(()=>{document.documentElement.lang=locale;document.documentElement.dir=locale==='en'?'ltr':'rtl';document.documentElement.classList.toggle('dark',prefs.theme==='dark');},[locale,prefs.theme]);

  async function save(id:string,kind:string,value:any){
    const item:Saved={id,kind,value:clean(value),updatedAt:Date.now()};
    if(!user){const next=[item,...localItems().filter(x=>x.id!==id)];writeLocal(next);setGuestItems(next);return true;}
    try{const db=kind==='chat'?chatDb:userDb;const path=kind==='chat'?`users/${user.uid}/chats/${safe(id)}`:`users/${user.uid}/state/${safe(id)}`;await set(ref(db,path),item);return true}catch{toast.error(d.tryAgain);return false}
  }

  async function remove(id:string){
    if(!user){const next=localItems().filter(x=>x.id!==id);writeLocal(next);setGuestItems(next);return true;}
    try{const isChat=id.startsWith('chat:');await removeValue(ref(isChat?chatDb:userDb,isChat?`users/${user.uid}/chats/${safe(id)}`:`users/${user.uid}/state/${safe(id)}`));return true}catch{toast.error(d.tryAgain);return false}
  }

  async function logout(){await signOut(auth)}
  async function saveProfilePicture(dataUrl:string){if(!user)return false;try{await update(ref(userDb,`users/${user.uid}/profile`),{photoDataUrl:dataUrl,name:prefs.name||user.displayName||'',updatedAt:Date.now()});setProfilePhoto(dataUrl);return true}catch{toast.error(d.tryAgain);return false}}

  return <State.Provider value={{locale,d,prefs,setPrefs,items,signedIn,ready,user,profilePhoto,save,remove,logout,saveProfilePicture}}>{children}<Toaster position="bottom-center" richColors dir={locale==='en'?'ltr':'rtl'}/></State.Provider>;
}
export const useQ=()=>useContext(State);
