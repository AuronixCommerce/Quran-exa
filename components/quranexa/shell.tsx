'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {BookOpen,Search,Globe2,UserRound,Menu,Bookmark,History,Sparkles,LockKeyhole,House} from 'lucide-react';
import {Sheet,SheetTrigger,SheetContent,SheetTitle,SheetClose} from '@/components/ui/sheet';
import {useQ} from './context';
import {Choice} from './controls';
import {languageOptions} from '@/lib/quranexa/i18n';
import {SelectionAsk} from './selection-ask';

export function Shell({children}:{children:React.ReactNode}){
  const {locale,d,signedIn,profilePhoto}=useQ();
  const path=usePathname();
  const nav=[['quran',d.quran],['hadith',d.hadith],['duas',d.duas],['ask',d.ask]];
  const mobile=[['',d.home],...nav,['kalmas',d.kalmas],['bookmarks',d.bookmarks],['history',d.history],['settings',d.settings]];
  const isActive=(p:string)=>p?path.includes('/'+p):path===`/${locale}`||path===`/${locale}/`;
  const protectedIcon=(kind:'bookmarks'|'history')=>!signedIn?<LockKeyhole size={17}/>:kind==='bookmarks'?<Bookmark size={17}/>:<History size={17}/>;

  return <>
    <a className="skip-link" href="#main-content">{locale==='en'?'Skip to content':locale==='ur'?'مواد پر جائیں':'انتقل إلى المحتوى'}</a>
    <header className="site-header">
      <div className="header-inner">
        <Link href={'/'+locale} className="brand" aria-label="Quran - Exa home">
          <span className="brand-icon"><BookOpen size={22}/></span><span>Quran - Exa</span>
        </Link>

        <nav className="desktop-nav" aria-label={d.home}>
          {nav.map(([p,t])=><Link key={p} href={`/${locale}/${p}`} aria-current={isActive(p)?'page':undefined} className={isActive(p)?'active':''}>{p==='ask'&&<Sparkles size={14}/>}<span>{t}</span></Link>)}
        </nav>

        <div className="header-actions">
          <Link href={`/${locale}/search`} aria-label={d.search} className="icon-button"><Search size={18}/></Link>
          <Link href={`/${locale}/bookmarks`} aria-label={!signedIn?`${d.bookmarks} — sign in required`:d.bookmarks} className="icon-button desktop-protected-action">{protectedIcon('bookmarks')}</Link>
          <Link href={`/${locale}/history`} aria-label={!signedIn?`${d.history} — sign in required`:d.history} className="icon-button desktop-protected-action">{protectedIcon('history')}</Link>
          <div className="language-picker"><Globe2 size={16}/><Choice label={d.interface} value={locale} onChange={l=>{window.location.href=path.replace(/^\/(en|ur|ar)/,'/'+l)+window.location.search}} options={languageOptions(locale)}/></div>
          <Link href={`/${locale}/${signedIn?'profile':'login'}`} className="account-button" aria-label={signedIn?d.account:d.signIn}>
            {profilePhoto?<img src={profilePhoto} className="profile-avatar-img" style={{width:28,height:28,borderRadius:9}} alt=""/>:<UserRound size={17}/>}<span>{signedIn?d.account:d.signIn}</span>
          </Link>
          <Sheet>
            <SheetTrigger className="mobile-menu icon-button" aria-label={d.more}><Menu size={20}/></SheetTrigger>
            <SheetContent side={locale==='en'?'right':'left'} className="mobile-sheet">
              <SheetTitle>Quran - Exa</SheetTitle>
              <nav>{mobile.map(([p,t])=><SheetClose asChild key={p}><Link href={`/${locale}/${p}`}>{!signedIn&&(p==='bookmarks'||p==='history')&&<LockKeyhole size={14}/>}<span>{t}</span></Link></SheetClose>)}</nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>

    <main id="main-content" className="main-container" tabIndex={-1}>{children}</main>

    <nav className="mobile-dock" aria-label={d.home}>
      <Link href={`/${locale}`} className={isActive('')?'active':''}><House/><span>{d.home}</span></Link>
      <Link href={`/${locale}/quran`} className={isActive('quran')?'active':''}><BookOpen/><span>{d.quran}</span></Link>
      <Link href={`/${locale}/ask`} className={isActive('ask')?'active':''}><Sparkles/><span>{d.ask}</span></Link>
      <Link href={`/${locale}/bookmarks`} className={isActive('bookmarks')?'active':''}>{signedIn?<Bookmark/>:<LockKeyhole/>}<span>{d.bookmarks}</span></Link>
      <Link href={`/${locale}/${signedIn?'profile':'login'}`} className={isActive(signedIn?'profile':'login')?'active':''}>{profilePhoto?<img src={profilePhoto} className="dock-avatar" alt=""/>:<UserRound/>}<span>{signedIn?d.account:d.signIn}</span></Link>
    </nav>

    <SelectionAsk locale={locale}/>

    <footer>
      <div className="footer-top"><Link href={'/'+locale} className="brand"><BookOpen size={20}/>Quran - Exa</Link><span>{d.tagline}</span><nav><Link href={`/${locale}/kalmas`}>{d.kalmas}</Link><Link href={`/${locale}/sources`}>{d.sourcePolicy}</Link><Link href={`/${locale}/privacy`}>{d.privacy}</Link></nav></div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} Quran - Exa</span><span>{d.sourcePrivacy}</span></div>
    </footer>
  </>;
}
