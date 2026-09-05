"""Create immutable, sharded source assets and a bounded inverted search index."""
import json,re,hashlib,collections,html
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'public/corpus';OUT.mkdir(parents=True,exist_ok=True)
def write(path,data):
 p=OUT/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')))
def norm(s):
 s=re.sub('[\u064b-\u065f\u0670\u06d6-\u06ed]','',s.lower());return s.translate(str.maketrans('إأآٱىیکةہھؤئ','ااااييكهههءء'))
def words(s):return set(re.findall(r'[^\W_]{2,}',norm(s),re.UNICODE))
stop=set('the and for that this with from was were his him her she have has had not but you your are who what which when then they their them said all ibn bin upon عن من في أن ان قال على إلى لا ما هو هذا يا بن الله صلى وسلم عليه إني كان وقد کہ کے کی کا اور میں سے ہے ہیں کو نے پر یہ وہ بھی ایک'.split())
postings=collections.defaultdict(list);sourceids=[];inventory=[];catalog=[];translation_mismatches=[]
def add_index(s):
 idx=len(sourceids);sourceids.append(s['id']);content=' '.join(str(s.get(k,'')) for k in ['title','arabic','en','ur','book','narrator']);
 for word in words(content)-stop:
  if len(word)<=42:postings[word].append(idx)
def text(s):return html.unescape(re.sub('<[^>]+>','',s or ''))
for col in ['bukhari','muslim','abudawud','tirmidhi','nasai','ibnmajah']:
 editions={};sections={};name=''
 for lang in ['eng','ara','urd']:
  records={}
  for file in sorted((ROOT/f'data/imports/hadith/{col}/{lang}').glob('*.json')):
   j=json.loads(file.read_text());name=j['metadata']['name']
   if lang=='eng':sections.update(j['metadata'].get('section',{}))
   for row in j['hadiths']:
    k=str(row['hadithnumber']);records[k]=row
  editions[lang]=records
 buckets=collections.defaultdict(list);bookids=collections.defaultdict(list)
 for key in sorted(set().union(*(set(e) for e in editions.values())),key=float):
  h=editions['eng'].get(key) or editions['ara'].get(key) or editions['urd'][key]
  a=editions['ara'].get(key);u=editions['urd'].get(key)
  def aligned(other):return other and other.get('reference')==h.get('reference')
  if a and not aligned(a):translation_mismatches.append([col,key,'ara']);a=None
  if u and not aligned(u):translation_mismatches.append([col,key,'urd']);u=None
  book=str(h.get('reference',{}).get('book',0));body=text(editions['eng'].get(key,{}).get('text',''));arabic=text(a['text']) if a else ''
  urdu=text(u['text']) if u else ''
  if not body.strip() and not arabic.strip() and not urdu.strip():continue
  primary='eng' if body.strip() else 'ara' if arabic.strip() else 'urd'
  narrator=re.match(r'^(?:Narrated\s+([^:]+):|([^:]{2,90})\s+(?:reported|narrated|said):)',body)
  s={'id':f'hadith:{col}:{key}','kind':'hadith','title':f'{name} {key}','arabic':arabic,'en':body,'ur':urdu, 'url':f'/hadith/{col}/{key}','sourceUrl':f'https://github.com/fawazahmed0/hadith-api/blob/1/editions/{primary}-{col}/{key}.json','collection':col,'book':sections.get(book,f'Book {book}'),'bookId':book,'grades':editions[primary][key].get('grades',[]),'narrator':next((x for x in narrator.groups() if x),None) if narrator else None,'reference':h.get('reference')}
  if primary=='urd':s['textLanguage']='ur'
  if primary=='ara':s['textLanguage']='ar'
  buckets[str(int(float(key)//100))].append(s);bookids[book].append(key);add_index(s)
 for k,v in buckets.items():write(Path(f'hadith/{col}/{k}.json'),v)
 catalog.append({'id':col,'name':name,'count':sum(map(len,buckets.values())),'books':[{'id':k,'name':sections.get(k,f'Book {k}'),'ids':v} for k,v in sorted(bookids.items(),key=lambda x:int(x[0]))]})
for slug,lang,name,source in [('ar-tafsir-muyassar','ar','التفسير الميسر','https://qul.tarteel.ai/resources/tafsir/38'),('en-tafisr-ibn-kathir','en','Tafsir Ibn Kathir','https://qul.tarteel.ai/resources/tafsir/35'),('ur-tafseer-ibn-e-kaseer','ur','تفسیر ابن کثیر','https://quran.com/')]:
 total=0
 for file in sorted((ROOT/f'data/imports/tafsir/{slug}').glob('*.json')):
  rows=json.loads(file.read_text());unique={};mapping={}
  for row in rows:
   if not row.get('text','').strip():continue
   body=text(row['text']);key=hashlib.sha256(body.encode()).hexdigest()[:20];unique[key]=body;mapping[str(row['ayah'])]=key;total+=1
   s={'id':f'tafsir:{slug}:{row["surah"]}:{row["ayah"]}','title':f'{name} {row["surah"]}:{row["ayah"]}',lang if lang!='ar' else 'arabic':body}
   # Repeated commentary groups are indexed once, with their first ayah.
   if list(mapping.values()).count(key)==1:add_index(s)
  write(Path(f'tafsir/{slug}/{file.name}'),{'texts':unique,'ayahs':mapping})
 inventory.append({'slug':slug,'language':lang,'name':name,'source':source,'count':total})
write(Path('catalog.json'),catalog);write(Path('tafsirs.json'),inventory);write(Path('search/ids.json'),sourceids)
shards=collections.defaultdict(dict)
for word,ids in postings.items():
 # An entire chapter-size result set for a common word has no discriminative retrieval value.
 if len(ids)<=4000:shards[str(sum(map(ord,word))%256)][word]=ids
for n in range(256):write(Path(f'search/{n}.json'),shards[str(n)])
(ROOT/'data/catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,separators=(',',':')))
(ROOT/'data/tafsirs.json').write_text(json.dumps(inventory,ensure_ascii=False))
(ROOT/'data/corpus-report.json').write_text(json.dumps({'hadith':[{k:c[k] for k in ['id','count']} for c in catalog],'tafsir':inventory,'translationAlignmentMismatches':translation_mismatches,'indexedSources':len(sourceids),'tokens':len(postings)},ensure_ascii=False,indent=2))
print(json.dumps({'collections':[(c['id'],c['count']) for c in catalog],'tafsirs':[(t['slug'],t['count']) for t in inventory],'indexed':len(sourceids),'alignment_mismatches':len(translation_mismatches)}))
