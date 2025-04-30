import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { Camera, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function UserHome() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out.',
    });
    setLocation('/login');
  };

  const handleScan = () => {
    setLocation('/scan');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar with logout */}
      <header className="w-full p-4 flex justify-between items-center border-b">
        <h1 className="text-xl font-bold">AR Image Scanner</h1>
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 flex flex-col items-center justify-center">
        <Card className="w-full max-w-md mx-auto shadow-lg bg-card">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="mb-6 mt-4">
              <Camera className="h-24 w-24 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Welcome, {user?.email}</h2>
            <p className="text-muted-foreground mb-6">
              Use the camera button below to scan an image and view its associated 3D model.
            </p>
            <Button 
              size="lg" 
              className="w-full rounded-full py-6 text-lg font-semibold"
              onClick={handleScan}
            >
              <Camera className="mr-2 h-5 w-5" />
              Start Scanning
            </Button>
          </CardContent>
        </Card>
      </main>

      <footer className="p-4 text-center text-sm text-muted-foreground">
        <p>AR Image Scanner App &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
