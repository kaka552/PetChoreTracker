import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Move } from 'lucide-react';

interface ModelRendererProps {
  modelUrl: string;
  description: string;
}

export default function ModelRenderer({ modelUrl, description }: ModelRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [interactionMode, setInteractionMode] = useState<'rotate' | 'pan' | 'zoom'>('rotate');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Mock 3D rendering with a placeholder
  // In a real app, this would use Three.js, React Three Fiber, or a similar library
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Simulate loading the 3D model
    const loadingTimer = setTimeout(() => {
      // 10% chance of error for demonstration
      if (Math.random() < 0.1) {
        setError('Failed to load 3D model. Please try again.');
      } else {
        setIsLoading(false);
      }
    }, 2000);
    
    return () => clearTimeout(loadingTimer);
  }, [modelUrl]);
  
  // Handle double tap to show description
  const handleDoubleTap = () => {
    setDescriptionOpen(true);
  };
  
  // Change interaction mode
  const changeMode = (mode: 'rotate' | 'pan' | 'zoom') => {
    setInteractionMode(mode);
  };
  
  // Reset view to default
  const resetView = () => {
    // In a real app, this would reset the camera position/rotation
    console.log('View reset');
  };
  
  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-destructive/10 p-4 rounded-full mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-destructive">
            <path d="M18 6L6 18M6 6l12 12"></path>
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2">Failed to Load Model</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Loading 3D model...</p>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* 3D viewer */}
      <div 
        ref={containerRef}
        className="flex-1 relative bg-gray-900 rounded-lg overflow-hidden"
        onDoubleClick={handleDoubleTap}
      >
        {/* This would be replaced with actual 3D model rendering */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-48 h-48 bg-gradient-to-br from-primary to-primary/50 rounded-xl transform-gpu animate-pulse">
            <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg">
              3D Model View
            </div>
          </div>
        </div>
        
        {/* Interaction mode indicator */}
        <div className="absolute top-4 left-4 bg-background/80 rounded-full px-3 py-1.5 text-sm font-medium">
          {interactionMode === 'rotate' && 'Rotate Mode'}
          {interactionMode === 'pan' && 'Pan Mode'}
          {interactionMode === 'zoom' && 'Zoom Mode'}
        </div>
        
        {/* Instructions */}
        <div className="absolute bottom-4 left-4 right-4 bg-background/80 backdrop-blur-sm rounded-lg p-2 text-xs text-center">
          Drag to {interactionMode}. Double tap for description.
        </div>
      </div>
      
      {/* Controls */}
      <div className="p-3 bg-muted rounded-b-lg flex justify-between">
        <div className="flex space-x-2">
          <Button 
            variant={interactionMode === 'rotate' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => changeMode('rotate')}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Rotate
          </Button>
          <Button 
            variant={interactionMode === 'pan' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => changeMode('pan')}
          >
            <Move className="h-4 w-4 mr-1" />
            Pan
          </Button>
          <Button 
            variant={interactionMode === 'zoom' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => changeMode('zoom')}
          >
            <Maximize2 className="h-4 w-4 mr-1" />
            Zoom
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={resetView}>
          Reset View
        </Button>
      </div>
      
      {/* Model description dialog */}
      <Dialog open={descriptionOpen} onOpenChange={setDescriptionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Model Description</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </div>
  );
}
