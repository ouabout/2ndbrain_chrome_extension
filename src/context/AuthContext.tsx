import { User } from "firebase/auth";
import { createContext, ReactNode, useContext, useState } from "react";

const Auth_State_Context = createContext<{
  user: User | null;
  set_user: (data: User | null) => void;
}>({
  user: null,
  set_user: (data: User | null) => {},
});

export const Auth_State_Provider = ({ children }: { children: ReactNode }) => {
  const [user, set_user] = useState<User | null>(null);
  return (
    <Auth_State_Context.Provider value={{ user, set_user }}>
      {children}
    </Auth_State_Context.Provider>
  );
};

export const useAuthContenxt = () => {
  const { user, set_user } = useContext(Auth_State_Context);

  return { user, set_user };
};
