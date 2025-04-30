import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { Camera, LogOut, Upload, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function DevHome() {
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

  const handleUpload = () => {
    setLocation('/dev/upload');
  };

  const handleManage = () => {
    setLocation('/dev/models');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar with logout */}
      <header className="w-full p-4 flex justify-between items-center border-b">
        <h1 className="text-xl font-bold">AR Image Scanner - Developer</h1>
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 flex flex-col items-center">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold mb-1">Welcome, Developer</h2>
          <p className="text-muted-foreground">{user?.email}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          {/* Scan card */}
          <Card className="shadow-md">
            <CardHeader>
              <Camera className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-xl">Scan Images</CardTitle>
              <CardDescription>
                Scan image targets to view their associated 3D models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Use your device's camera to scan image targets and interact with the 3D models that appear.
              </p>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleScan}>
                <Camera className="mr-2 h-4 w-4" />
                Start Camera
              </Button>
            </CardFooter>
          </Card>

          {/* Upload card */}
          <Card className="shadow-md">
            <CardHeader>
              <Upload className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-xl">Upload Models</CardTitle>
              <CardDescription>
                Add new 3D models and map them to image targets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Upload new 3D models, assign image targets, and add descriptions for users to interact with.
              </p>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleUpload}>
                <Upload className="mr-2 h-4 w-4" />
                Upload New Model
              </Button>
            </CardFooter>
          </Card>

          {/* Manage card */}
          <Card className="shadow-md md:col-span-2">
            <CardHeader>
              <Database className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-xl">Manage Models</CardTitle>
              <CardDescription>
                Edit, update, or remove existing model mappings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View all your uploaded models, edit their details, update image targets, or remove models that are no longer needed.
              </p>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleManage}>
                <Database className="mr-2 h-4 w-4" />
                Manage Models
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>

      <footer className="p-4 text-center text-sm text-muted-foreground">
        <p>AR Image Scanner App &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
