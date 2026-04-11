import { Layout } from "@/components/Layout";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Categories from "./pages/Categories";
import Dashboard from "./pages/Dashboard";
import Investments from "./pages/Investments";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";
import Payables from "./pages/Payables";
import PlannedExpenses from "./pages/PlannedExpenses";
import Transactions from "./pages/Transactions";
import Settings from "./pages/Settings";
import Fiscalite from "./pages/Fiscalite";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="a-payer" element={<Payables />} />
        <Route path="investissements" element={<Investments />} />
        <Route path="fiscalite" element={<Fiscalite />} />
        <Route path="categories" element={<Categories />} />
        <Route path="depenses-prevues" element={<PlannedExpenses />} />
        <Route path="parametres" element={<Settings />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <DataProvider>
            <AppRoutes />
          </DataProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
