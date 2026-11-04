import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useOutreachCapture } from "./hooks/useOutreachCapture";
import Home from "./pages/Home";
import Feed from "./pages/Feed";
import ProjectDetail from "./pages/ProjectDetail";
import CreateProject from "./pages/CreateProject";
import EditProject from "./pages/EditProject";
import Dashboard from "./pages/Dashboard";
import ProfilePage from "./pages/ProfilePage";
import WorkspacePage from "./pages/WorkspacePage";
import AdminPage from "./pages/AdminPage";
import OutreachPage from "./pages/OutreachPage";
import NotFound from "./pages/NotFound";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/projects" component={Feed} />
      <Route path="/projects/new" component={CreateProject} />
      <Route path="/projects/:id/edit" component={EditProject} />
      <Route path="/projects/:id/workspace" component={WorkspacePage} />
      <Route path="/projects/:id" component={ProjectDetail} />
      <Route path="/profile/:id" component={ProfilePage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/admin/outreach" component={OutreachPage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useOutreachCapture();
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
