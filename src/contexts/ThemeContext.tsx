import { createContext, useContext, ReactNode, useState } from "react";

export type AppTheme = "dark" | "light" | "midnight" | "sunset";

interface ThemeConfig {
  label: string;
  name: string;
  colors: string;
  gradient: string;
  background: string;
  foreground: string;
  primary: string;
  accent: string;
}

export const THEMES: Record<AppTheme, ThemeConfig> = {
  dark: {
    label: "Escuro",
    name: "Escuro",
    colors: "bg-zinc-900",
    gradient: "from-zinc-900 to-black",
    background: "0 0% 5%",
    foreground: "0 0% 95%",
    primary: "0 72% 51%",
    accent: "45 100% 51%",
  },
  light: {
    label: "Claro",
    name: "Claro",
    colors: "bg-white",
    gradient: "from-white to-gray-100",
    background: "0 0% 98%",
    foreground: "0 0% 10%",
    primary: "0 72% 51%",
    accent: "45 100% 51%",
  },
  midnight: {
    label: "Meia-Noite",
    name: "Meia-Noite",
    colors: "bg-indigo-950",
    gradient: "from-indigo-950 to-slate-950",
    background: "230 60% 8%",
    foreground: "220 20% 90%",
    primary: "230 80% 60%",
    accent: "280 80% 60%",
  },
  sunset: {
    label: "Pôr do Sol",
    name: "Pôr do Sol",
    colors: "bg-orange-950",
    gradient: "from-orange-950 to-red-950",
    background: "15 40% 8%",
    foreground: "30 20% 90%",
    primary: "25 90% 55%",
    accent: "350 80% 55%",
  },
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
