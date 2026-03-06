import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import ToolPage from "./pages/ToolPage";
import UsageHistory from "./pages/UsageHistory";
import Billing from "./pages/Billing";
import AdminPanel from "./pages/AdminPanel";
import Onboarding from "./pages/Onboarding";
import QuickDeploy from "./pages/QuickDeploy";
import Profile from "./pages/Profile";
import Analytics from "./pages/Analytics";
import Marketplace from "./pages/Marketplace";
import ChangelogPage from "./pages/ChangelogPage";
import FAQ from "./pages/FAQ";
import StatusPage from "./pages/StatusPage";
import Settings from "./pages/Settings";
import ConversationHistory from "./pages/ConversationHistory";
import ToolDetail from "./pages/ToolDetail";
import Favorites from "./pages/Favorites";
import UsageDashboard from "./pages/UsageDashboard";
import PricingComparison from "./pages/PricingComparison";

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/" component={Home} />
      <Route path="/marketplace" component={Marketplace} />
      <Route path="/changelog" component={ChangelogPage} />
      <Route path="/faq" component={FAQ} />
      <Route path="/status" component={StatusPage} />

      {/* User dashboard */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/dashboard/tool/:slug" component={ToolPage} />
      <Route path="/dashboard/history" component={UsageHistory} />
      <Route path="/dashboard/billing" component={Billing} />
      <Route path="/dashboard/profile" component={Profile} />
      <Route path="/dashboard/settings" component={Settings} />

      {/* Tool detail (public) */}
      <Route path="/tools/:slug" component={ToolDetail} />

      {/* Conversation history */}
      <Route path="/dashboard/conversations" component={ConversationHistory} />
      <Route path="/dashboard/favorites" component={Favorites} />
      <Route path="/dashboard/usage" component={UsageDashboard} />

      {/* Pricing */}
      <Route path="/pricing" component={PricingComparison} />

      {/* Shortcuts */}
      <Route path="/billing" component={Billing} />
      <Route path="/profile" component={Profile} />
      <Route path="/settings" component={Settings} />
      <Route path="/onboarding" component={Onboarding} />

      {/* Admin */}
      <Route path="/admin" component={AdminPanel} />
      <Route path="/admin/quick-deploy" component={QuickDeploy} />
      <Route path="/admin/analytics" component={Analytics} />

      {/* Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
