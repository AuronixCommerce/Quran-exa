'use client';

import {getApp,getApps,initializeApp} from 'firebase/app';
import {getAuth,GoogleAuthProvider} from 'firebase/auth';
import {getDatabase} from 'firebase/database';

const config={
  apiKey:process.env.NEXT_PUBLIC_FIREBASE_API_KEY||'AIzaSyANKvF8gbGsuYfkLXaNFhuPlkkM59kKxCc',
  authDomain:process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN||'quranexaauthpfp.firebaseapp.com',
  databaseURL:process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL||'https://quranexaauthpfp-default-rtdb.firebaseio.com',
  projectId:process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID||'quranexaauthpfp',
  storageBucket:process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET||'quranexaauthpfp.firebasestorage.app',
  messagingSenderId:process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID||'928239595080',
  appId:process.env.NEXT_PUBLIC_FIREBASE_APP_ID||'1:928239595080:web:56b44960f831518a45327d',
};

export const firebaseReady=true;
export const firebaseApp=getApps().length?getApp():initializeApp(config);
export const auth=getAuth(firebaseApp);
export const userDb=getDatabase(firebaseApp,config.databaseURL);
export const googleProvider=new GoogleAuthProvider();
googleProvider.setCustomParameters({prompt:'select_account'});
