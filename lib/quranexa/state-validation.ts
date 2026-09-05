import {z} from 'zod';import {answerSchema} from './validation';
const sourceRef=z.object({id:z.string().max(150)}).passthrough();const savedAnswer=answerSchema.extend({language:z.enum(['en','ur','ar']),sources:z.array(sourceRef).max(12)});
const locale=z.enum(['en','ur','ar']);
export const preferencesSchema=z.object({translation:z.enum(['en','ur']),aiLanguage:locale,fontSize:z.number().min(24).max(64),translationSize:z.number().min(16).max(30),theme:z.enum(['light','dark']),readingMode:z.enum(['both','arabic','translation']),arabicFont:z.enum(['serif','sans-serif']),name:z.string().max(80)}).strict();
export const savedSchema=z.discriminatedUnion('kind',[
 z.object({id:z.literal('preferences'),kind:z.literal('preferences'),value:preferencesSchema}),
 z.object({id:z.string().startsWith('bookmark:').max(150),kind:z.literal('bookmark'),value:z.object({id:z.string().max(150)}).passthrough()}),
 z.object({id:z.string().startsWith('history:').max(150),kind:z.literal('history'),value:z.object({surah:z.number().int().min(1).max(114),ayah:z.number().int().min(1).max(286)}).passthrough()}),
 z.object({id:z.string().startsWith('chat:').max(150),kind:z.literal('chat'),value:z.object({title:z.string().max(65),turns:z.array(z.object({question:z.string().max(1800),answer:savedAnswer.optional(),error:z.string().max(1000).optional(),sources:z.array(sourceRef).max(20).optional()})).max(50),context:sourceRef.nullable().optional()})})
]);
