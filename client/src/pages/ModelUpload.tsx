import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { createModel } from '@/lib/models';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/context/AuthContext';
import ModelUploadForm from '@/components/ModelUploadForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function ModelUpload() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  // Create model mutation
  const mutation = useMutation({
    mutationFn: createModel,
    onSuccess: () => {
      // Invalidate the models cache to refetch the list
      queryClient.invalidateQueries({ queryKey: ['/api/models'] });
    },
  });
  
  // Handle back button
  const handleBack = () => {
    setLocation('/');
  };
  
  // Handle form submission
  const handleSubmit = async (data: {
    model_name: string;
    image_target: string;
    model_file_url: string;
    description: string;
  }) => {
    await mutation.mutateAsync(data);
  };
  
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
        <h1 className="text-xl font-bold">Upload 3D Model</h1>
      </header>
      
      {/* Main content */}
      <main className="flex-1 p-4 max-w-xl mx-auto w-full">
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-2">Add a New Model</h2>
          <p className="text-sm text-muted-foreground">
            Upload a 3D model and associate it with an image target. When users scan the image, they'll see your 3D model.
          </p>
        </div>
        
        <ModelUploadForm onSubmit={handleSubmit} />
      </main>
    </div>
  );
}
