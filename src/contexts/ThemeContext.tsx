import { createContext, useContext, ReactNode, useState } from "react";

export type AppTheme = "dark" | "light" | "midnight" | "sunset";

export const THEMES: Record<AppTheme, { label: string; colors: string }> = {
  dark: { label: "Escuro", colors: "bg-zinc-900" },
  light: { label: "Claro", colors: "bg-white" },
  midnight: { label: "Meia-Noite", colors: "bg-indigo-950" },
  sunset: { label: "Pôr do Sol", colors: "bg-orange-950" },
};

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (t: AppTheme) => void;
  isKids: boolean;
  setIsKids: (v: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  setTheme: () => {},
  isKids: false,
  setIsKids: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<AppTheme>("dark");
  const [isKids, setIsKids] = useState(false);
  return (
    <ThemeContext.Provider value={{ theme, setTheme, isKids, setIsKids }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
