import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/AppLayout";
import LoginPage from "@/pages/Login";
import OrdersPage from "@/pages/Orders";
import NewOrderPage from "@/pages/NewOrder";
import MenuPage from "@/pages/Menu";
import StatsPage from "@/pages/Stats";
import UsersPage from "@/pages/Users";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-4xl mb-4">🍔</div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/orders" replace />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/new" element={<NewOrderPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
