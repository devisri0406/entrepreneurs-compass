import { Link } from "@tanstack/react-router";
import { Rocket } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4 md:px-6">
        <div>
          <div className="flex items-center gap-2 font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg gradient-hero text-primary-foreground"><Rocket className="h-4 w-4" /></span>
            Startup Navigator
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Your AI-powered guide to building successful startups — from incorporation to exit.
          </p>
        </div>
        <div>
          <div className="mb-3 text-sm font-semibold">Product</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/explore" className="hover:text-foreground">Explore Topics</Link></li>
            <li><Link to="/ai" className="hover:text-foreground">AI Advisor</Link></li>
            <li><Link to="/resources" className="hover:text-foreground">Resources</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-3 text-sm font-semibold">Account</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/auth" className="hover:text-foreground">Sign in</Link></li>
            <li><Link to="/dashboard" className="hover:text-foreground">Dashboard</Link></li>
            <li><Link to="/bookmarks" className="hover:text-foreground">Bookmarks</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-3 text-sm font-semibold">Company</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Built for builders</li>
            <li>Made with care</li>
          </ul>
        </div>
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 text-xs text-muted-foreground md:px-6">
          <span>© {new Date().getFullYear()} Startup Navigator</span>
          <span>All systems nominal.</span>
        </div>
      </div>
    </footer>
  );
}
