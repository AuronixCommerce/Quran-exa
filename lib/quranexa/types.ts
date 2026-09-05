export type Locale = 'en'|'ur'|'ar';
export type Verse = {id:number;text:string;translation:string;transliteration:string;urdu:string;juz:number;page:number;hizb:number;sajdah:boolean};
export type Surah = {id:number;name:string;transliteration:string;translation:string;type:string;total_verses:number;slug:string;verses:Verse[]};
export type Source = {excerpt?:boolean;id:string;kind:'quran'|'hadith'|'dua'|'tafsir'|'kalma';title:string;arabic:string;en:string;ur?:string;transliteration?:string;url:string;surah?:number;ayah?:number;collection?:string;grades?:{name:string;grade:string}[];book?:string;sourceUrl?:string;juz?:number;page?:number;hizb?:number;sajdah?:boolean;textLanguage?:Locale;edition?:string;bookId?:string;narrator?:string;reference?:{book:number;hadith:number}};
export type Preferences = {translation:'en'|'ur';aiLanguage:Locale;fontSize:number;translationSize:number;theme:'light'|'dark';readingMode:'both'|'arabic'|'translation';arabicFont:'serif'|'sans-serif';name:string};
export type Saved = {id:string;kind:string;value:any;updatedAt:number};
