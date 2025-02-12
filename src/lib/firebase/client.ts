// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDVkcu9XwYEgM5V6FtOLvwMn24xGOYO_oM",
  authDomain: "ai-labs-ff491.firebaseapp.com",
  projectId: "ai-labs-ff491",
  storageBucket: "ai-labs-ff491.appspot.com",
  messagingSenderId: "1032701550694",
  appId: "1:1032701550694:web:7de34a995d528c29c64da7",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

export const clientAuth = getAuth(app);
