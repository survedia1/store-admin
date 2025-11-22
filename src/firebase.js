import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// بيانات مشروعك كما هي
const firebaseConfig = {
  apiKey: "AIzaSyCwla7uLtzLRcjRkW3vn_FoNEUWvkanz9U",
  authDomain: "mystore-2a558.firebaseapp.com",
  projectId: "mystore-2a558",
  storageBucket: "mystore-2a558.firebasestorage.app",
  messagingSenderId: "253373083480",
  appId: "1:253373083480:web:cce0bb98cff65a1ea37f2d",
  measurementId: "G-HKM9MSMPZ3"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);