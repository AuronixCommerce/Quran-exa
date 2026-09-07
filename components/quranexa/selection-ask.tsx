'use client';

import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import {Sparkles} from 'lucide-react';
import {Locale} from '@/lib/quranexa/types';

type SelectionState={text:string;x:number;y:number}|null;
export function SelectionAsk({locale}:{locale:Locale}){const router=useRouter();const [selection,setSelection]=useState<SelectionState>(null);
useEffect(()=>{function read(){requestAnimationFrame(()=>{const selected=window.getSelection();const text=selected?.toString().trim()||'';if(!selected||selected.rangeCount===0||text.length<2||text.length>700){setSelection(null);return}const range=selected.getRangeAt(0),node=range.commonAncestorContainer,parent=node.nodeType===Node.ELEMENT_NODE?node as Element:node.parentElement;if(!parent?.closest('.main-container')){setSelection(null);return}if(parent.closest('input,textarea,[contenteditable="true"]')){setSelection(null);return}const rect=range.getBoundingClientRect();if(!rect.width&&!rect.height){setSelection(null);return}setSelection({text,x:Math.min(window.innerWidth-90,Math.max(90,rect.left+rect.width/2)),y:Math.max(54,rect.top-8)});})}document.addEventListener('mouseup',read);document.addEventListener('touchend',read);document.addEventListener('selectionchange',()=>{if(!window.getSelection()?.toString().trim())setSelection(null)});return()=>{document.removeEventListener('mouseup',read);document.removeEventListener('touchend',read)}},[]);
if(!selection)return null;const label=locale==='ur'?'Quran - Exa سے پوچھیں':locale==='ar'?'اسأل Quran - Exa':'Ask Quran - Exa';return <button className="selection-ask" style={{left:selection.x,top:selection.y}} onMouseDown={e=>e.preventDefault()} onClick={()=>{const q=locale==='ur'?`اس منتخب متن کا مطلب، سیاق اور متعلقہ مستند حوالہ سمجھائیں: ${selection.text}`:locale==='ar'?`اشرح معنى وسياق هذا النص المحدد مع المصادر الموثوقة: ${selection.text}`:`Explain the meaning and context of this selected text using verified sources: ${selection.text}`;setSelection(null);window.getSelection()?.removeAllRanges();router.push(`/${locale}/ask?q=${encodeURIComponent(q)}`)}}><Sparkles size={14}/>{label}</button>}
