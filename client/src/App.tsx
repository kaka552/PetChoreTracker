import { useEffect } from 'react';
import { Switch, Route, useLocation } from 'wouter';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import UserHome from '@/pages/UserHome';
import DevHome from '@/pages/DevHome';
import ARScanner from '@/pages/ARScanner';
import ModelViewer from '@/pages/ModelViewer';
import ModelUpload from '@/pages/ModelUpload';
import ModelManagement from '@/pages/ModelManagement';
import NotFound from '@/pages/not-found';

// Protected route component
const ProtectedRoute: React.FC<{
  component: React.ComponentType;
  requiredRole?: 'user' | 'dev';
}> = ({ component: Component, requiredRole }) => {
  const [location, setLocation] = useLocation();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      setLocation('/login');
    } else if (!loading && requiredRole && user?.role !== requiredRole) {
      setLocation('/');
    }
  }, [user, loading, requiredRole, setLocation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requiredRole && user.role !== requiredRole) {
    return null;
  }

  return <Component />;
};

function Router() {
  const { user } = useAuth();

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Default route based on user role */}
      <Route path="/">
        {user?.role === 'dev' ? <DevHome /> : <UserHome />}
      </Route>
      
      {/* Protected user routes */}
      <Route path="/scan">
        <ProtectedRoute component={ARScanner} />
      </Route>
      <Route path="/model/:id">
        {(params) => <ProtectedRoute component={() => <ModelViewer id={parseInt(params.id)} />} />}
      </Route>
      
      {/* Protected dev routes */}
      <Route path="/dev/upload">
        <ProtectedRoute component={ModelUpload} requiredRole="dev" />
      </Route>
      <Route path="/dev/models">
        <ProtectedRoute component={ModelManagement} requiredRole="dev" />
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
