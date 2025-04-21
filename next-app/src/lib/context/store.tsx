"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  SetStateAction,
} from "react";

type User = {
  name: string;
  email: string;
};

type AppContextType = {
  loginDetail: {
    userName: string;
    role: "admin" | "user" | string;
  };
  setLoginDetail: React.Dispatch<
    SetStateAction<{
      userName: string;
      role: "admin" | "user" | string;
    }>
  >;
  login: () => void;
  logout: () => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [loginDetail, setLoginDetail] = useState({
    userName: "",
    role: "",
  });

  function login() {}
  function logout() {}

  return (
    <AppContext.Provider
      value={{
        loginDetail,
        setLoginDetail,
        login,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppStore must be used within an AppProvider");
  }
  return context;
};
