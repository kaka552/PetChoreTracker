import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { getModel } from '@/lib/models';
import ModelRenderer from '@/components/ModelRenderer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface ModelViewerProps {
  id: number;
}

export default function ModelViewer({ id }: ModelViewerProps) {
  const [, setLocation] = useLocation();
  
  // Fetch model data
  const { data: model, isLoading, error } = useQuery({
    queryKey: [`/api/models/${id}`],
  });
  
  // Handle back button
  const handleBack = () => {
    setLocation('/scan');
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-bold">Loading model</h2>
        <p className="text-muted-foreground">Preparing 3D content...</p>
      </div>
    );
  }
  
  // Error state
  if (error || !model) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="text-destructive mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2">Failed to load model</h2>
        <p className="text-muted-foreground mb-6 text-center">
          We couldn't load the 3D model. It may have been removed or there was a connection error.
        </p>
        <Button onClick={handleBack}>Return to Scanner</Button>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="w-full p-4 flex items-center border-b">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleBack}
          className="mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">{model.model_name}</h1>
      </header>
      
      {/* 3D Model Viewer */}
      <main className="flex-1 p-4">
        <ModelRenderer 
          modelUrl={model.model_file_url}
          description={model.description}
        />
      </main>
    </div>
  );
}
