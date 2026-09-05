import {Source} from './types';
export function sourcePreview(s:Source):Source{let excerpt=false;const shorten=(text:string|undefined)=>{if(!text||text.length<=1200)return text;excerpt=true;const cut=text.lastIndexOf(' ',1200);return text.slice(0,cut>900?cut:1200)+'…'};const arabic=shorten(s.arabic)||'',en=shorten(s.en)||'',ur=shorten(s.ur);return {...s,arabic,en,ur,excerpt};}
