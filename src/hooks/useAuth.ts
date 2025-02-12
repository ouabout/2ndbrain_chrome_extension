import { onAuthStateChanged, getAuth } from "firebase/auth";
import { useEffect } from "react";
import { app } from "../lib/firebase/client";
import { useAuthContenxt } from "@/context/AuthContext";

export const useAuth = () => {
  const { user, set_user } = useAuthContenxt();

  const auth = getAuth(app);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (auth_user) => {
      if (auth_user) set_user(auth_user);
      else set_user(user ?? null);
    });

    return () => unsub();
  }, []);

  return { user, auth };
};
