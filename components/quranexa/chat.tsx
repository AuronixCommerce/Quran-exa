'use client';

import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {
  ArrowUp,
  BookOpen,
  Copy,
  Flag,
  History,
  LoaderCircle,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Square,
  ThumbsUp,
  X,
} from 'lucide-react';
import {toast} from 'sonner';
import {Dialog,DialogContent,DialogHeader,DialogTitle} from '@/components/ui/dialog';
import {Sheet,SheetClose,SheetContent,SheetTitle,SheetTrigger} from '@/components/ui/sheet';
import {DeleteButton} from './account';
import {Choice} from './controls';
import {useQ} from './context';
import {SourceCard} from './passages';
import {Typewriter} from './typewriter';
import {auth} from '@/lib/quranexa/firebase';
import {languageOptions} from '@/lib/quranexa/i18n';
import {sourceLabel} from '@/lib/quranexa/labels';
import {Source} from '@/lib/quranexa/types';

type Answer={
  claims:{text:string;sourceIds:string[]}[];
  sources:Source[];
  suggestions:string[];
  language:string;
};

type Turn={
  question:string;
  answer?:Answer;
  error?:string;
  sources?:Source[];
};

export function Chat({initialQuestion='',context}:{initialQuestion?:string;context?:Source|null}){
  const {locale,d,prefs,setPrefs,items,save,signedIn}=useQ();
  const [remaining,setRemaining]=useState<number|null>(null);
  const [animated,setAnimated]=useState(false);
  const [question,setQuestion]=useState(initialQuestion);
  const [turns,setTurns]=useState<Turn[]>([]);
  const [id,setId]=useState('');
  const [busy,setBusy]=useState(false);
  const [mode,setMode]=useState('ask');
  const [search,setSearch]=useState('');
  const [attached,setAttached]=useState<Source|null>(context||null);
  const [report,setReport]=useState<Answer|null>(null);
  const [reason,setReason]=useState('citation');
  const [details,setDetails]=useState('');
  const [reportBusy,setReportBusy]=useState(false);
  const [rename,setRename]=useState<any|null>(null);
  const [newName,setNewName]=useState('');

  const abort=useRef<AbortController|null>(null);
  const bottom=useRef<HTMLDivElement>(null);
  const follow=useRef(true);
  const restored=useRef(false);

  const chats=items
    .filter(x=>x.kind==='chat'&&x.value?.title?.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b)=>b.updatedAt-a.updatedAt);

  useEffect(()=>{
    if(restored.current||initialQuestion||context||turns.length)return;
    const recent=chats[0];
    if(recent){
      setTurns(recent.value.turns||[]);
      setId(recent.id);
      setAttached(recent.value.context||null);
    }
    restored.current=true;
  },[chats,initialQuestion,context,turns.length]);

  useEffect(()=>{
    const onScroll=()=>{
      follow.current=window.innerHeight+window.scrollY>=document.documentElement.scrollHeight-220;
    };
    window.addEventListener('scroll',onScroll,{passive:true});
    onScroll();
    return()=>window.removeEventListener('scroll',onScroll);
  },[]);

  useEffect(()=>{
    if(follow.current)bottom.current?.scrollIntoView({behavior:'smooth',block:'end'});
  },[turns,busy]);

  useEffect(()=>()=>abort.current?.abort(),[]);

  useEffect(()=>{
    if(signedIn){
      setRemaining(null);
      return;
    }
    fetch('/api/guest')
      .then(r=>r.ok?r.json():null)
      .then(v=>{if(v)setRemaining(v.remaining)})
      .catch(()=>{});
  },[signedIn]);

  async function makeTitle(q:string){
    try{
      const r=await fetch('/api/chat-title',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({question:q,language:prefs.aiLanguage}),
      });
      const v=await r.json();
      return String(v.title||q).slice(0,65);
    }catch{
      return q.slice(0,65);
    }
  }

  async function saveConversation(chatId:string,base:Turn[],completed:Turn[],q:string){
    const previous=items.find(x=>x.id===chatId)?.value;
    const first=base.length===0;
    const title=first?await makeTitle(q):(previous?.title||base[0]?.question?.slice(0,65)||q.slice(0,65));
    await save(chatId,'chat',{
      title,
      firstQuestion:previous?.firstQuestion||base[0]?.question||q,
      turns:completed,
      context:attached?{id:attached.id}:null,
      createdAt:previous?.createdAt||Date.now(),
      updatedAt:Date.now(),
    });
  }

  async function send(q=question,regenerate=false){
    const trimmed=q.trim();
    if(trimmed.length<2||busy)return;
    if(!signedIn&&remaining===null){toast(d.loading);return;}
    if(!signedIn&&remaining===0){toast(d.quotaReached);return;}

    follow.current=true;
    setAnimated(true);
    const chatId=id||`chat:${crypto.randomUUID()}`;
    setId(chatId);
    const base=regenerate?turns.slice(0,-1):turns;
    setTurns([...base,{question:trimmed}]);
    setQuestion('');
    setBusy(true);

    const controller=new AbortController();
    abort.current=controller;

    try{
      const token=auth.currentUser?await auth.currentUser.getIdToken():'';
      const response=await fetch('/api/ai',{
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          ...(token?{Authorization:`Bearer ${token}`}:{})
        },
        body:JSON.stringify({
          question:trimmed,
          language:prefs.aiLanguage,
          mode,
          context:attached?.id||turns.at(-1)?.answer?.sources?.[0]?.id,
        }),
        signal:controller.signal,
      });

      if(response.headers.has('X-Quranexa-Remaining')){
        setRemaining(Number(response.headers.get('X-Quranexa-Remaining')));
      }

      if(!response.ok){
        const data=await response.json().catch(()=>({error:d.tryAgain}));
        if(data.remaining===0)setRemaining(0);
        const completed:Turn[]=[...base,{question:trimmed,error:data.error||d.tryAgain,sources:data.sources}];
        setTurns(completed);
        await saveConversation(chatId,base,completed,trimmed);
        return;
      }

      if(!response.body){
        const completed:Turn[]=[...base,{question:trimmed,error:d.tryAgain}];
        setTurns(completed);
        await saveConversation(chatId,base,completed,trimmed);
        return;
      }

      const reader=response.body.getReader();
      const decoder=new TextDecoder();
      let buffer='';
      let finalAnswer:Answer|null=null;
      let streamError='';
      let partial:Answer={claims:[],sources:[],suggestions:[],language:prefs.aiLanguage};

      while(true){
        const piece=await reader.read();
        if(piece.done)break;
        buffer+=decoder.decode(piece.value,{stream:true});
        let newline=buffer.indexOf('\n');
        while(newline>=0){
          const line=buffer.slice(0,newline).trim();
          buffer=buffer.slice(newline+1);
          newline=buffer.indexOf('\n');
          if(!line)continue;
          try{
            const event=JSON.parse(line);
            if(event.type==='claim'&&event.claim){
              const sourceMap=new Map<string,Source>();
              [...partial.sources,...(event.sources||[])].forEach((source:Source)=>sourceMap.set(source.id,source));
              partial={
                ...partial,
                claims:[...partial.claims,event.claim],
                sources:[...sourceMap.values()],
                language:event.language||partial.language,
              };
              setTurns([...base,{question:trimmed,answer:partial}]);
            }
            if(event.type==='answer')finalAnswer=event.answer;
            if(event.type==='error')streamError=event.error||d.tryAgain;
          }catch{}
        }
      }

      const completed:Turn[]=streamError||!finalAnswer
        ?[...base,{question:trimmed,error:streamError||d.tryAgain}]
        :[...base,{question:trimmed,answer:finalAnswer}];
      setTurns(completed);
      await saveConversation(chatId,base,completed,trimmed);
    }catch(error){
      if((error as Error).name==='AbortError'){
        setTurns(base);
        setQuestion(trimmed);
      }else{
        const failed:Turn[]=[...base,{question:trimmed,error:d.tryAgain}];
        setTurns(failed);
        await saveConversation(chatId,base,failed,trimmed);
      }
    }finally{
      setBusy(false);
    }
  }

  async function feedback(answer:Answer,type:'helpful'|'report'){
    try{
      const token=auth.currentUser?await auth.currentUser.getIdToken():'';
      const response=await fetch('/api/feedback',{
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          ...(token?{Authorization:`Bearer ${token}`}:{})
        },
        body:JSON.stringify({
          type,
          reason:type==='report'?reason:undefined,
          details:type==='report'?details:undefined,
          answer:answer.claims.map(c=>c.text).join('\n'),
          sources:answer.sources.map(s=>s.id),
        }),
      });
      if(!response.ok)throw new Error('feedback');
      toast.success(d.reportThanks);
      setReport(null);
    }catch{
      toast.error(d.tryAgain);
    }
  }

  function newChat(){
    if(busy)return;
    restored.current=true;
    follow.current=true;
    setTurns([]);
    setId('');
    setQuestion('');
    setAttached(null);
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function loadChat(chat:any){
    if(busy)return;
    setAnimated(false);
    setTurns(chat.value.turns||[]);
    setId(chat.id);
    setAttached(chat.value.context||null);
    follow.current=true;
  }

  return (
    <div className="chat-page">
      <div className="chat-toolbar">
        <span><Sparkles size={19}/>{d.ask}</span>
        <div>
          <Sheet>
            <SheetTrigger className="button secondary">
              <History size={16}/><span>{d.chats}</span>
            </SheetTrigger>
            <SheetContent className="chat-history" side={locale==='en'?'left':'right'}>
              <SheetTitle>{d.chats}</SheetTitle>
              <div className="input-wrap">
                <Search size={16}/>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={d.searchChats} aria-label={d.searchChats}/>
              </div>
              {chats.map(chat=>(
                <div className="chat-history-item" key={chat.id}>
                  <SheetClose asChild><button disabled={busy} onClick={()=>loadChat(chat)}>{chat.value.title}</button></SheetClose>
                  <button className="icon-button" aria-label={d.rename} onClick={()=>{setRename(chat);setNewName(chat.value.title)}}>
                    <Pencil size={14}/>
                  </button>
                  <DeleteButton id={chat.id}/>
                </div>
              ))}
              {!chats.length&&<p>{d.noChats}</p>}
            </SheetContent>
          </Sheet>
          <button className="button secondary" disabled={busy} onClick={newChat}>
            <Plus size={17}/><span>{d.newChat}</span>
          </button>
        </div>
      </div>

      {!turns.length&&(
        <div className="chat-welcome">
          <span className="chat-emblem"><Sparkles size={33} strokeWidth={1.4}/></span>
          <p className="eyebrow">Quran - Exa</p>
          <h1>{d.ask}</h1>
          <p>{d.sourceNote}</p>
          <div className="prompt-grid">
            {[
              ['explain',locale==='en'?'Explain Surah Al-Fatihah':locale==='ur'?'سورۃ الفاتحہ کی وضاحت کریں':'اشرح سورة الفاتحة'],
              ['find',locale==='en'?'Find verses about patience':locale==='ur'?'صبر کے بارے میں آیات تلاش کریں':'آيات عن الصبر'],
              ['hadith',locale==='en'?'Which Hadith discusses intentions?':locale==='ur'?'نیت کے بارے میں حدیث':'حديث عن النية'],
              ['simple',locale==='en'?'Explain Quran 2:255':locale==='ur'?'آیت 2:255 کی وضاحت کریں':'اشرح الآية 2:255'],
            ].map(([nextMode,prompt])=>(
              <button key={nextMode} onClick={()=>{setMode(nextMode);setQuestion(prompt)}}>
                <BookOpen size={18}/><span>{prompt}</span><ArrowUp size={16}/>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="chat-turns" aria-busy={busy}>
        {turns.map((turn,index)=>(
          <div className="chat-turn" key={`${index}-${turn.question}`}>
            <div className="user-message" dir="auto">{turn.question}</div>
            <div className="assistant-message">
              <div className="assistant-label"><Sparkles size={19}/> Quran - Exa <span>{d.explanation}</span></div>
              {turn.error&&<div className="notice">{turn.error}</div>}
              {turn.answer&&(
                <>
                  <div lang={turn.answer.language} dir={turn.answer.language==='en'?'ltr':'rtl'}>
                    {turn.answer.claims.map((claim,claimIndex)=>(
                      <div key={claimIndex} className="answer-claim">
                        <p><Typewriter text={claim.text} animate={animated&&index===turns.length-1}/></p>
                        <div className="citation-tags">
                          {claim.sourceIds.map(sourceId=>{
                            const found=turn.answer?.sources.find(source=>source.id===sourceId);
                            return found?<a key={sourceId} href={`#source-${index}-${sourceId}`}>{sourceLabel(found,locale)}</a>:null;
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {!!turn.answer.sources.length&&(
                    <>
                      <h3 className="chat-source-title"><ShieldCheck size={16}/>{d.sources}</h3>
                      <div className="chat-source-cards">
                        {turn.answer.sources.map(source=>(
                          <div key={source.id} id={`source-${index}-${source.id}`}>
                            <SourceCard source={source} compact/>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <div className="answer-actions">
                    <button
                      aria-label={d.copy}
                      onClick={async()=>{
                        try{
                          await navigator.clipboard.writeText(turn.answer!.claims.map(c=>c.text).join('\n\n'));
                          toast.success(d.copied);
                        }catch{
                          toast.error(d.tryAgain);
                        }
                      }}
                    >
                      <Copy size={16}/>
                    </button>
                    <button
                      aria-label={d.share}
                      onClick={async()=>{
                        const text=turn.answer!.claims.map(c=>c.text).join('\n\n');
                        try{
                          if(navigator.share)await navigator.share({title:'Quran - Exa',text});
                          else{
                            await navigator.clipboard.writeText(text);
                            toast.success(d.copied);
                          }
                        }catch{}
                      }}
                    >
                      <Share2 size={16}/>
                    </button>
                    <button aria-label={d.helpful} onClick={()=>feedback(turn.answer!,'helpful')}>
                      <ThumbsUp size={16}/>
                    </button>
                    <button aria-label={d.report} onClick={()=>setReport(turn.answer!)}>
                      <Flag size={16}/>
                    </button>
                    {index===turns.length-1&&(
                      <button disabled={busy} onClick={()=>send(turn.question,true)}>
                        <RotateCcw size={16}/>{d.regenerate}
                      </button>
                    )}
                  </div>

                  <div className="followups">
                    {(turn.answer.suggestions||[]).map(suggestion=>(
                      <button disabled={busy} key={suggestion} onClick={()=>setQuestion(suggestion)}>{suggestion}</button>
                    ))}
                  </div>
                </>
              )}
              {turn.sources?.map(source=><SourceCard key={source.id} source={source} compact/>)}
            </div>
          </div>
        ))}
      </div>

      {busy&&<div className="chat-loading" role="status"><LoaderCircle size={18} className="spin"/>{d.loading}</div>}
      <div ref={bottom}/>

      <div className="composer-wrap">
        {attached&&(
          <div className="attached-context">
            <BookOpen size={16}/>{sourceLabel(attached,locale)}
            <button aria-label={d.remove} onClick={()=>setAttached(null)}><X size={16}/></button>
          </div>
        )}
        <form className="composer" onSubmit={event=>{event.preventDefault();send()}}>
          <textarea
            maxLength={1800}
            minLength={2}
            rows={2}
            dir="auto"
            value={question}
            onChange={event=>setQuestion(event.target.value)}
            aria-label={d.question}
            placeholder={d.askHint}
            onKeyDown={event=>{
              if(event.key==='Enter'&&!event.shiftKey&&!event.nativeEvent.isComposing){
                event.preventDefault();
                send();
              }
            }}
          />
          <div className="composer-bottom">
            <div>
              <Choice
                label={d.modes}
                value={mode}
                onChange={setMode}
                options={[
                  {value:'ask',label:d.ask},
                  {value:'explain',label:d.explain},
                  {value:'simple',label:d.simple},
                  {value:'find',label:d.find},
                  {value:'hadith',label:d.hadith},
                  {value:'compare',label:d.compare},
                  {value:'tafsir',label:d.tafsir},
                ]}
              />
              <Choice
                label={d.answerLanguage}
                value={prefs.aiLanguage}
                onChange={value=>setPrefs({...prefs,aiLanguage:value as any})}
                options={languageOptions(locale)}
              />
            </div>
            {busy?(
              <button type="button" className="send-button" aria-label={d.stop} onClick={()=>abort.current?.abort()}>
                <Square size={17}/>
              </button>
            ):(
              <button type="submit" className="send-button" disabled={question.trim().length<2} aria-label={d.send}>
                <ArrowUp size={21}/>
              </button>
            )}
          </div>
        </form>
        <p className="composer-note"><ShieldCheck size={13}/>{d.sourceNote}</p>
        {!signedIn&&(
          <div className="guest-chat-note">
            <p>{d.guestChatNote}</p>
            <p>{remaining===null?d.guestQuota:`${remaining.toLocaleString(locale)} / 10 ${d.messagesLeft}`}</p>
            <Link className="text-link" href={`/${locale}/login`}>
              {locale==='ur'?'کھاتے کے ساتھ ہم آہنگ کریں':locale==='ar'?'سجّل الدخول للمزامنة':'Sign in to sync across devices'}
            </Link>
          </div>
        )}
      </div>

      <Dialog open={!!report} onOpenChange={()=>setReport(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{d.reportTitle}</DialogTitle></DialogHeader>
          <Choice
            label={d.reportReasons}
            value={reason}
            onChange={setReason}
            options={[
              {value:'citation',label:locale==='ur'?'حوالہ':'Citation'},
              {value:'translation',label:d.translation},
              {value:'explanation',label:d.explanation},
              {value:'other',label:locale==='ur'?'دیگر':locale==='ar'?'أخرى':'Other'},
            ]}
          />
          <textarea maxLength={1500} value={details} onChange={event=>setDetails(event.target.value)} placeholder={d.reportDetails}/>
          <button
            className="button primary"
            disabled={reportBusy}
            onClick={async()=>{
              if(!report)return;
              setReportBusy(true);
              await feedback(report,'report');
              setReportBusy(false);
            }}
          >
            {reportBusy?<LoaderCircle className="spin" size={16}/>:null}{d.submit}
          </button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rename} onOpenChange={()=>setRename(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{d.rename}</DialogTitle></DialogHeader>
          <input maxLength={65} value={newName} onChange={event=>setNewName(event.target.value)}/>
          <button
            className="button primary"
            disabled={!newName.trim()}
            onClick={async()=>{
              if(rename&&await save(rename.id,'chat',{...rename.value,title:newName.trim(),updatedAt:Date.now()}))setRename(null);
            }}
          >
            {d.save}
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
