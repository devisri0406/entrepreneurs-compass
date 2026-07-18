import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/theme-provider";
import { Rocket, Moon, Sun, Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const nav = [
  { to: "/explore", label: "Explore" },
  { to: "/ai", label: "AI Advisor" },
  { to: "/resources", label: "Resources" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const { user, loading } = useAuth();
  const { theme, toggle } = useTheme();
  const nav_state = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }
  const initial = (user?.email ?? "?").slice(0, 1).toUpperCase();

  return (
    <header className="sticky top-0 z-50 glass border-b">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg gradient-hero text-primary-foreground shadow-glow">
            <Rocket className="h-4 w-4" />
          </span>
          <span>Startup Navigator</span>
        </Link>
        <nav className="ml-6 hidden items-center gap-1 md:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={`rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground ${nav_state.startsWith(n.to) ? "text-foreground" : ""}`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={toggle}>
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {!loading && !user && (
            <>
              <Link to="/auth" className="hidden md:block">
                <Button variant="ghost">Sign in</Button>
              </Link>
              <Link to="/auth">
                <Button className="gradient-hero text-primary-foreground shadow-glow">Get started</Button>
              </Link>
            </>
          )}
          {!loading && user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Account">
                  <Avatar className="h-8 w-8"><AvatarFallback>{initial}</AvatarFallback></Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/dashboard" })}>Dashboard</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/bookmarks" })}>Bookmarks</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>Profile</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/admin" })}>Admin</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      {open && (
        <div className="border-t md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 p-3">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} className="rounded-md px-3 py-2 text-sm hover:bg-muted" onClick={() => setOpen(false)}>
                {n.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
