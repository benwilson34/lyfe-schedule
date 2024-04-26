import React, { Dispatch, createContext, useContext, useState } from "react";

export type AuthContext = {
  isAdmin: boolean;
  setIsAdmin: Dispatch<React.SetStateAction<boolean>>;
};

export const AuthContext = createContext<AuthContext | null>(null);

export default function AuthContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  return (
    <AuthContext.Provider
      value={{
        isAdmin,
        setIsAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(
      "useAuthContext must be used within a AuthContextProvider"
    );
  }
  return context;
}
