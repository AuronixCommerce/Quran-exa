import 'server-only';

import {App,cert,getApps,initializeApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getDatabase} from 'firebase-admin/database';

function required(name:string){
  const value=process.env[name]?.trim();
  if(!value)throw new Error(`Missing server configuration: ${name}`);
  return value;
}

function privateKey(name:string){
  return required(name).replace(/\\n/g,'\n');
}

function namedApp(name:string,projectId:string,clientEmail:string,key:string,databaseURL?:string):App{
  const existing=getApps().find(app=>app.name===name);
  if(existing)return existing;
  return initializeApp({
    credential:cert({projectId,clientEmail,privateKey:key}),
    ...(databaseURL?{databaseURL}:{}),
  },name);
}

function authApp(){
  return namedApp(
    'quran-exa-auth-admin',
    required('FIREBASE_AUTH_PROJECT_ID'),
    required('FIREBASE_AUTH_CLIENT_EMAIL'),
    privateKey('FIREBASE_AUTH_PRIVATE_KEY'),
  );
}

function chatApp(){
  return namedApp(
    'quran-exa-chat-admin',
    required('FIREBASE_CHAT_PROJECT_ID'),
    required('FIREBASE_CHAT_CLIENT_EMAIL'),
    privateKey('FIREBASE_CHAT_PRIVATE_KEY'),
    required('FIREBASE_CHAT_DATABASE_URL'),
  );
}

export async function verifyFirebaseRequest(req:Request){
  const header=req.headers.get('authorization')||'';
  if(!header.startsWith('Bearer '))throw new Error('UNAUTHORIZED');
  const token=header.slice(7).trim();
  if(!token)throw new Error('UNAUTHORIZED');
  return getAuth(authApp()).verifyIdToken(token,true);
}

export function chatAdminDatabase(){
  return getDatabase(chatApp());
}
