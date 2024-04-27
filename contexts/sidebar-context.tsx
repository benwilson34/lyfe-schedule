import React, { Dispatch, createContext, useContext, useState } from "react";

export type SidebarContext = {
  isVisible: boolean;
  setIsVisible: Dispatch<React.SetStateAction<boolean>>;
  toggleVisibility: () => void;
};

export const SidebarContext = createContext<SidebarContext | null>(null);

export default function SidebarContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <SidebarContext.Provider
      value={{
        isVisible,
        setIsVisible,
        toggleVisibility,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error(
      "useSidebarContext must be used within a SidebarContextProvider"
    );
  }
  return context;
}
