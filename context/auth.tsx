import { auth, db } from "@/lib/firebase";
import { DEFAULT_COUNTRY, DEFAULT_CURRENCY_CODE, isSupportedCountry, isSupportedCurrencyCode, resolveCurrencyCodeFromCountry, setCurrentCurrencyCode } from "@/utils/currency";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import {
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithCredential,
    signInWithEmailAndPassword,
    signInWithPopup,
    updateProfile,
    User,
} from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";

const GOOGLE_WEB_CLIENT_ID = "127868684471-hpo9enspjskojsrnnt2pu1givrmq0lo4.apps.googleusercontent.com";

export interface UserProfile {
  photoBase64?: string | null;
  country?: string;
  currencyCode?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userProfile: UserProfile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (data: { displayName?: string; photoBase64?: string | null; country?: string; currencyCode?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Firebase Auth listener
  useEffect(() => {
    if (Platform.OS !== "web") {
      GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
    }
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      if (!firebaseUser) {
        setCurrentCurrencyCode(DEFAULT_CURRENCY_CODE);
        setUserProfile(null);
      }
    });
    return unsubscribe;
  }, []);

  // Firestore user profile listener
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      doc(db, "users", user.uid),
      (snap) => {
        const profile = snap.exists() ? (snap.data() as UserProfile) : {};
        const country = isSupportedCountry(profile.country) ? profile.country : DEFAULT_COUNTRY;
        const currencyCode = isSupportedCurrencyCode(profile.currencyCode) ? profile.currencyCode : resolveCurrencyCodeFromCountry(country, DEFAULT_CURRENCY_CODE);
        setCurrentCurrencyCode(currencyCode);
        setUserProfile({ ...profile, country, currencyCode });
      },
      () => {
        // Permission denied or offline — use empty profile, not a crash
        setCurrentCurrencyCode(DEFAULT_CURRENCY_CODE);
        setUserProfile({ country: DEFAULT_COUNTRY, currencyCode: DEFAULT_CURRENCY_CODE });
      },
    );
    return unsub;
  }, [user?.uid]);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  };

  const signUp = async (name: string, email: string, password: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await updateProfile(credential.user, { displayName: name.trim() });
    setUser({ ...credential.user, displayName: name.trim() } as User);
  };

  const signOut = async () => {
    // Sign out from Google SDK so the account chooser appears next time
    if (Platform.OS !== "web") {
      try {
        await GoogleSignin.signOut();
      } catch {
        /* ignore */
      }
    }
    await firebaseSignOut(auth);
  };

  const signInWithGoogle = async () => {
    if (Platform.OS === "web") {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
    } else {
      try {
        await GoogleSignin.hasPlayServices();
        const response = await GoogleSignin.signIn();
        const idToken = (response as any)?.data?.idToken ?? (response as any)?.idToken;
        if (!idToken) {
          console.error("Google Sign-In response:", response);
          throw new Error("No se obtuvo el token de Google.");
        }
        const credential = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(auth, credential);
      } catch (error: any) {
        console.error("Google Sign-In error details:", {
          code: error.code,
          message: error.message,
          fullError: error,
        });
        throw error;
      }
    }
  };

  const updateUserProfile = async (data: { displayName?: string; photoBase64?: string | null; country?: string; currencyCode?: string }) => {
    if (!user) return;
    if (data.displayName !== undefined) {
      await updateProfile(user, { displayName: data.displayName.trim() });
      setUser({ ...user, displayName: data.displayName.trim() } as User);
    }
    if (data.photoBase64 !== undefined) {
      await setDoc(doc(db, "users", user.uid), { photoBase64: data.photoBase64 }, { merge: true });
      setUserProfile((prev) => ({ ...(prev ?? {}), photoBase64: data.photoBase64 }));
    }

    if (data.country !== undefined) {
      const country = isSupportedCountry(data.country) ? data.country : DEFAULT_COUNTRY;
      const currencyCode = resolveCurrencyCodeFromCountry(country, DEFAULT_CURRENCY_CODE);
      await setDoc(doc(db, "users", user.uid), { country, currencyCode }, { merge: true });
      setCurrentCurrencyCode(currencyCode);
      setUserProfile((prev) => ({ ...(prev ?? {}), country, currencyCode }));
      return;
    }

    if (data.currencyCode !== undefined) {
      const currencyCode = isSupportedCurrencyCode(data.currencyCode) ? data.currencyCode : DEFAULT_CURRENCY_CODE;
      await setDoc(doc(db, "users", user.uid), { currencyCode }, { merge: true });
      setCurrentCurrencyCode(currencyCode);
      setUserProfile((prev) => ({ ...(prev ?? {}), currencyCode }));
    }
  };

  return <AuthContext.Provider value={{ user, loading, userProfile, signIn, signUp, signInWithGoogle, signOut, updateUserProfile }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
