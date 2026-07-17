import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";
interface Ctx { theme: Theme; setTheme: (t: Theme) => void; toggle: () => void }
const ThemeCtx = createContext<Ctx>({ theme: "light", setTheme: () => {}, toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const stored = (typeof window !== "undefined" && (localStorage.getItem("theme") as Theme | null)) || null;
    const preferred: Theme = stored ?? (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setThemeState(preferred);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    try { localStorage.setItem("theme", theme); } catch { /* ignore */ }
  }, [theme]);

  return (
    <ThemeCtx.Provider value={{ theme, setTheme: setThemeState, toggle: () => setThemeState((t) => (t === "dark" ? "light" : "dark")) }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);
