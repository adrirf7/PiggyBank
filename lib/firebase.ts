import { getApps, initializeApp } from "firebase/app";
import { getAuth, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyAI7H8yt8H2FP8Da_q8U5kqHYYuh_5aKrc",
  authDomain: "piggybank-bef97.firebaseapp.com",
  projectId: "piggybank-bef97",
  storageBucket: "piggybank-bef97.firebasestorage.app",
  messagingSenderId: "127868684471",
  appId: "1:127868684471:web:3ef86ef69f432896a96532",
};

// Avoid re-initializing on hot reload
const isNewApp = getApps().length === 0;
const app = isNewApp ? initializeApp(firebaseConfig) : getApps()[0];

function createAuth() {
  if (!isNewApp) return getAuth(app);
  // Web uses default browser persistence; native uses AsyncStorage
  if (Platform.OS === "web") {
    return getAuth(app);
  }
  // Lazy import to avoid bundling AsyncStorage on web
  const { getReactNativePersistence } = require("firebase/auth");
  const AsyncStorage = require("@react-native-async-storage/async-storage").default;
  return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
}

export const auth = createAuth();
export const db = getFirestore(app);
