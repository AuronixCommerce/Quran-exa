'use client';

import Link from 'next/link';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {ArrowRight,ArrowUp,ArrowUpRight,BookOpen,BookOpenText,HandHeart,LibraryBig,Search,ShieldCheck,Sparkles} from 'lucide-react';
import {sourceLabel} from '@/lib/quranexa/labels';
import {Source} from '@/lib/quranexa/types';
import {useQ} from './context';

type PopularSurah={id:number;slug:string;name:string;transliteration:string;translation:string;total_verses:number};

export function Home({daily,popular}:{daily:Source;popular:PopularSurah[]}){
  const {locale,d,prefs,items}=useQ();
  const router=useRouter();
  const [question,setQuestion]=useState('');
  const latest=items.find(item=>item.kind==='history');
  const copy=locale==='en'
    ?{hello:'A little closer, every day.',title:['Your space.','Your connection.'],hint:"What's on your mind?",ask:'Ask Quranexa',read:'Open the Quran',daily:'A moment to reflect'}
    :locale==='ur'
      ?{hello:'ہر دن، کچھ اور قریب۔',title:['آپ کی جگہ۔','آپ کا تعلق۔'],hint:'آپ کیا جاننا چاہتے ہیں؟',ask:'قرآن ایکسا سے پوچھیں',read:'قرآن پڑھیں',daily:'غور و فکر کا ایک لمحہ'}
      :{hello:'أقرب، كل يوم.',title:['مساحتك.','صلتك.'],hint:'بماذا تفكر؟',ask:'اسأل قرآن إكسا',read:'اقرأ القرآن',daily:'لحظة للتأمل'};
  const cards=[
    {path:'quran',icon:BookOpen,title:d.quran,desc:d.quranDesc,caption:d.fullQuran},
    {path:'hadith',icon:LibraryBig,title:d.hadith,desc:d.hadithDesc,caption:d.selected},
    {path:'duas',icon:HandHeart,title:d.duas,desc:d.duasDesc,caption:d.duaNotice},
  ];
  const ask=(event:React.FormEvent)=>{
    event.preventDefault();
    if(question.trim().length>=2)router.push(`/${locale}/ask?q=${encodeURIComponent(question.trim())}`);
  };

  return <>
    <section className="home-workspace">
      <div className="home-intro">
        <span className="hero-label"><Sparkles size={16}/>{copy.hello}</span>
        <h1>{copy.title.map(line=><span key={line}>{line}</span>)}</h1>
        <p>{d.tagline}</p>
      </div>
      <div className="home-ask">
        <div className="home-ask-heading"><span className="tile-icon"><Sparkles size={24}/></span><h2>{copy.ask}</h2><ArrowUpRight size={22}/></div>
        <form onSubmit={ask}>
          <label htmlFor="home-question">{copy.hint}</label>
          <textarea id="home-question" rows={2} minLength={2} maxLength={1800} dir="auto" value={question} onChange={event=>setQuestion(event.target.value)} placeholder={d.askHint}/>
          <div className="home-ask-bottom"><span><ShieldCheck size={15}/>{d.sources}</span><button type="submit" className="send-button" disabled={question.trim().length<2} aria-label={d.send}><ArrowUp size={22}/></button></div>
        </form>
        <div className="topic-row">{(['patience','guidance','forgiveness'] as const).map(topic=><Link href={`/${locale}/ask?q=${encodeURIComponent(d[topic])}`} key={topic}>{d[topic]}<ArrowUpRight size={13}/></Link>)}</div>
      </div>
      <Link className="home-read" href={latest?`/${locale}${latest.value.url}`:`/${locale}/quran/al-fatihah`}>
        <span className="home-read-top"><BookOpenText size={28}/><ArrowUpRight size={24}/></span>
        <span className="eyebrow">{latest?d.continue:d.begin}</span>
        <h2>{latest?latest.value.title:copy.read}</h2>
        <span>{latest?d.continue:d.fullQuran}<ArrowRight size={18}/></span>
      </Link>
    </section>

    <section className="home-lower">
      <div className="home-library">
        <div className="section-heading"><h2>{d.explore}</h2><Link className="icon-button" href={`/${locale}/search`} aria-label={d.search}><Search size={20}/></Link></div>
        <div className="explore-grid">{cards.map(card=><Link href={`/${locale}/${card.path}`} className={`explore-card explore-${card.path}`} key={card.path}><div className="card-top"><span className={`tile-icon ${card.path}`}><card.icon size={24}/></span><ArrowUpRight size={19}/></div><h3>{card.title}</h3><p>{card.desc}</p><span className="card-caption">{card.caption}</span></Link>)}</div>
      </div>
      <article className="reflection-card">
        <div className="reflection-top"><span>{copy.daily}</span><span aria-hidden="true">✧</span></div>
        <div className="reflection-verse" lang="ar" dir="rtl">{daily.arabic}</div>
        <p dir={prefs.translation==='ur'?'rtl':'ltr'} lang={prefs.translation}>{prefs.translation==='ur'?daily.ur:daily.en}</p>
        <div className="reflection-bottom"><span>{sourceLabel(daily,locale)}</span><Link href={`/${locale}${daily.url}`} className="icon-button" aria-label={d.open}><ArrowUpRight size={20}/></Link></div>
      </article>
    </section>

    <section className="section">
      <div className="section-heading"><h2>{d.popular}</h2><Link className="text-link" href={`/${locale}/quran`}>{d.allSurahs}<ArrowRight size={16}/></Link></div>
      <div className="surah-grid">{popular.map(surah=><Link key={surah.id} className="surah-card" href={`/${locale}/quran/${surah.slug}`}><span className="surah-number">{surah.id.toLocaleString(locale)}</span><div><h3>{locale==='en'?surah.transliteration:surah.name}</h3><p>{locale==='en'?surah.translation:`${surah.total_verses.toLocaleString(locale)} ${d.ayahs}`}</p></div><div className="surah-ar"><span lang="ar">{surah.name}</span><small>{surah.total_verses.toLocaleString(locale)} {d.ayahs}</small></div></Link>)}</div>
    </section>

    <section className="ceo-message"><p className="eyebrow">{d.ceoHeading}</p><h2>{d.ceoName}</h2><p className="ceo-role">{d.ceoRole}</p><p className="ceo-body">{d.ceoMessage}</p><p className="ceo-closing"><em>{d.ceoClosing}</em></p></section>
  </>;
}
