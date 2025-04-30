import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import CameraView from '@/components/CameraView';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { getAllModels } from '@/lib/models';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Camera, Loader2 } from 'lucide-react';

// Type for our model objects
interface ModelType {
  id: number;
  model_name: string;
  image_target: string;
  model_file_url: string;
  description: string;
  [key: string]: any; // Allow for additional properties
}

// A simple image matching function
// In a real app, this would use a more sophisticated algorithm
// or integrate with Vuforia's image recognition capabilities
function findMatchingModel(capturedImage: string, models: ModelType[]): ModelType | null {
  console.log(`Scanning image against ${models?.length || 0} available models`);
  
  // In a real implementation, this would do actual image comparison
  // using computer vision techniques like feature extraction and matching
  
  if (models && models.length > 0) {
    // For demo purposes, let's return the first model to ensure consistent behavior
    // In a real implementation, we would compare image features
    
    // First, log available models for debugging
    models.forEach((model, index) => {
      console.log(`Model ${index}: ${model.model_name}`);
    });
    
    console.log(`Selected model: ${models[0].model_name}`);
    return models[0]; // Always return the first model for consistent demo behavior
  }
  
  console.log('No models available to match against');
  return null;
}

export default function ARScanner() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [analyzingImage, setAnalyzingImage] = useState(false);
  
  // Fetch all models with proper typing
  const { data: models, isLoading, error } = useQuery<ModelType[]>({
    queryKey: ['/api/models'],
    staleTime: 60000, // 1 minute
  });

  // Handle image capture from camera
  const handleImageCaptured = async (imageData: string) => {
    setAnalyzingImage(true);
    
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Find matching model for the captured image - cast to proper type
      const modelsArray = Array.isArray(models) ? models as ModelType[] : [];
      const matchedModel = findMatchingModel(imageData, modelsArray);
      
      if (matchedModel) {
        toast({
          title: 'Target found!',
          description: `Matched with model: ${matchedModel.model_name}`,
        });
        
        // Navigate to model viewer with the matched model ID
        setLocation(`/model/${matchedModel.id}`);
      } else {
        toast({
          title: 'No match found',
          description: 'Try scanning a different image or ensure better lighting.',
          variant: 'destructive',
        });
        setAnalyzingImage(false);
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast({
        title: 'Processing failed',
        description: 'An error occurred while analyzing the image.',
        variant: 'destructive',
      });
      setAnalyzingImage(false);
    }
  };

  // Handle back button
  const handleBack = () => {
    setLocation('/');
  };

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="text-destructive mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2">Failed to load models</h2>
        <p className="text-muted-foreground mb-6 text-center">
          We couldn't load the required data for scanning. Please try again later.
        </p>
        <Button onClick={handleBack}>Return to Home</Button>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-bold">Loading scanner</h2>
        <p className="text-muted-foreground">Preparing image recognition...</p>
      </div>
    );
  }

  // Analyzing image overlay
  if (analyzingImage) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-bold">Analyzing image</h2>
        <p className="text-muted-foreground">Looking for matching models...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <CameraView 
        onImageCaptured={handleImageCaptured}
        onBack={handleBack}
      />
    </div>
  );
}
