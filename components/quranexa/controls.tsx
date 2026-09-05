'use client';
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from '@/components/ui/select';
import {ReactNode} from 'react';
export function Choice({value,onChange,options,label}:{value:string;onChange:(v:string)=>void;options:{value:string;label:string}[];label:string}){return <Select value={value} onValueChange={onChange}><SelectTrigger aria-label={label} className="choice"><SelectValue/></SelectTrigger><SelectContent>{options.map(o=><SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>}
export function PageHead({eyebrow,title,description,children}:{eyebrow?:string;title:string;description?:string;children?:ReactNode}){return <div className="page-head">{eyebrow&&<p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description&&<p>{description}</p>}{children}</div>}
