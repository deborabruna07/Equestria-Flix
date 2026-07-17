import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// ✨ NOVO: Ferramentas de Login!
import { getAuth, GoogleAuthProvider } from "firebase/auth"; 

const firebaseConfig = {
  apiKey: "AIzaSyBye6-vDBDQC09qU5gDyjlW_kzvY71Ts5I",
  authDomain: "ponyverse-database-529ff.firebaseapp.com",
  projectId: "ponyverse-database-529ff",
  storageBucket: "ponyverse-database-529ff.firebasestorage.app",
  messagingSenderId: "744701284561",
  appId: "1:744701284561:web:2ffc66e7ca56ade12ab5f0"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// ✨ NOVO: Inicializa o Autenticador e o provedor do Google
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();