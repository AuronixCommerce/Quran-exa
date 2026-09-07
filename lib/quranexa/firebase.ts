'use client';

import {getApp,getApps,initializeApp} from 'firebase/app';
import {getAuth,GoogleAuthProvider} from 'firebase/auth';
import {getDatabase} from 'firebase/database';

const config={
  apiKey:process.env.NEXT_PUBLIC_FIREBASE_API_KEY||'',
  authDomain:process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN||'',
  databaseURL:process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL||'',
  projectId:process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID||'',
  storageBucket:process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET||'',
  messagingSenderId:process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID||'',
  appId:process.env.NEXT_PUBLIC_FIREBASE_APP_ID||'',
};

export const firebaseReady=Boolean(config.apiKey&&config.authDomain&&config.projectId&&config.appId&&config.databaseURL);
export const firebaseApp=getApps().length?getApp():initializeApp(config);
export const auth=getAuth(firebaseApp);
export const userDb=getDatabase(firebaseApp,config.databaseURL||undefined);
export const chatDb=getDatabase(firebaseApp,process.env.NEXT_PUBLIC_FIREBASE_CHAT_DATABASE_URL||config.databaseURL||undefined);
export const googleProvider=new GoogleAuthProvider();
googleProvider.setCustomParameters({prompt:'select_account'});
