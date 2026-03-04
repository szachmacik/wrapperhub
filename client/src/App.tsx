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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/dashboard/tool/:slug" component={ToolPage} />
      <Route path="/dashboard/history" component={UsageHistory} />
      <Route path="/dashboard/billing" component={Billing} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/admin/quick-deploy" component={QuickDeploy} />
      <Route path="/profile" component={Profile} />
      <Route path="/billing" component={Billing} />
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
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
