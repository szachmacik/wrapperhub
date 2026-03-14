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
import About from "./pages/About";
import Contact from "./pages/Contact";
import ToolHistory from "./pages/ToolHistory";
import ApiKeys from "./pages/ApiKeys";
import EmbedWidget from "./pages/EmbedWidget";
import NotificationsPage from "./pages/NotificationsPage";
import Referral from "./pages/Referral";
import Leaderboard from "./pages/Leaderboard";
import Integrations from "./pages/Integrations";
import { WhatsNew } from "./components/WhatsNew";
import Login from "@/pages/Login";

function Router() {
  return (
    <Switch>
        <Route path="/login" component={Login} />
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

      {/* About & Contact */}
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />

      {/* Tool history per tool */}
      <Route path="/dashboard/tool/:slug/history" component={ToolHistory} />

      {/* Shortcuts */}
      <Route path="/billing" component={Billing} />
      <Route path="/profile" component={Profile} />
      <Route path="/settings" component={Settings} />
      <Route path="/onboarding" component={Onboarding} />

      {/* BYOK, Embed, Notifications */}
      <Route path="/dashboard/api-keys" component={ApiKeys} />
      <Route path="/dashboard/embed" component={EmbedWidget} />
      <Route path="/dashboard/notifications" component={NotificationsPage} />
      <Route path="/dashboard/referral" component={Referral} />
      <Route path="/dashboard/leaderboard" component={Leaderboard} />
      <Route path="/dashboard/integrations" component={Integrations} />

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
          <WhatsNew />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
