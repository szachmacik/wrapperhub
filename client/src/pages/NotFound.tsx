import { Button } from "@/components/ui/button";
import { Sparkles, Home, ArrowLeft, Search } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
      </div>

      <div className="relative text-center max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
        </div>

        {/* 404 */}
        <div className="text-8xl font-black text-primary/20 leading-none mb-4 select-none">
          404
        </div>

        <h1 className="text-2xl font-bold mb-3">Page not found</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => navigate("/")}>
            <Home className="h-4 w-4 mr-2" /> Go Home
          </Button>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Dashboard
          </Button>
        </div>

        {/* Quick links */}
        <div className="mt-10 pt-8 border-t border-border/50">
          <p className="text-sm text-muted-foreground mb-4">Quick links</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { label: "AI Tools", path: "/dashboard" },
              { label: "Billing", path: "/dashboard/billing" },
              { label: "Profile", path: "/profile" },
              { label: "History", path: "/dashboard/history" },
            ].map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className="text-sm text-primary hover:underline px-2 py-1 rounded hover:bg-primary/5 transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
