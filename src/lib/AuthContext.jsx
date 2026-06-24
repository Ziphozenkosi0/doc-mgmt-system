// AuthContext — keeps track of "who is logged in" and "what role they have"
// anywhere in the app, without passing props down manually everywhere.
import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);     // Firebase auth user object
  const [role, setRole] = useState(null);     // "admin" | "approver" | "viewer"
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fires whenever someone logs in, logs out, or refreshes the page.
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Look up this user's role from Firestore.
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          setRole(userDoc.data().role);
        } else {
          setRole(null);
        }
      } else {
        setRole(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  async function signup(email, password, role) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    // Save their role in Firestore, keyed by their unique user ID.
    await setDoc(doc(db, "users", result.user.uid), {
      email,
      role,
      createdAt: new Date().toISOString(),
    });
    setRole(role);
    return result.user;
  }

  async function login(email, password) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  }

  async function logout() {
    await signOut(auth);
  }

  const value = { user, role, loading, signup, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
