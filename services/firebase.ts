import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuration provided by the user
const firebaseConfig = {
  apiKey: "AIzaSyDpjoXrPKKOtzquU51HVo6OrxaDMO-qqfA",
  authDomain: "blackyoz.firebaseapp.com",
  projectId: "blackyoz",
  storageBucket: "blackyoz.firebasestorage.app",
  messagingSenderId: "755714215090",
  appId: "1:755714215090:web:2f81b5c72a19212f3a0dab",
  measurementId: "G-G7VH7372S1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);