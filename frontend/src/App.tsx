import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppLayout } from './components/layout/AppLayout';

import { LandingPage } from './pages/Landing';
import { AuthPage } from './pages/AuthPages';
import { DashboardPage } from './pages/Dashboard';
import { AgentWizardPage } from './pages/AgentWizard';
import { PlaygroundPage } from './pages/Playground';
import { ToolsPage } from './pages/Tools';
import { KnowledgeBasePage } from './pages/KnowledgeBase';
import { WorkflowBuilderPage } from './pages/WorkflowBuilder';
import { ApprovalsPage } from './pages/Approvals';
import { ApiKeysPage } from './pages/ApiKeys';
import { ObservabilityPage } from './pages/Observability';
import { EvaluationsPage } from './pages/Evaluations';
import { AdminPage } from './pages/Admin';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Landing & Auth Routes */}
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />

            {/* Authenticated Platform App Routes */}
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="agents" element={<AgentWizardPage />} />
              <Route path="playground" element={<PlaygroundPage />} />
              <Route path="tools" element={<ToolsPage />} />
              <Route path="knowledge" element={<KnowledgeBasePage />} />
              <Route path="workflows" element={<WorkflowBuilderPage />} />
              <Route path="approvals" element={<ApprovalsPage />} />
              <Route path="api-keys" element={<ApiKeysPage />} />
              <Route path="observability" element={<ObservabilityPage />} />
              <Route path="evaluations" element={<EvaluationsPage />} />
              <Route path="admin" element={<AdminPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/landing" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
