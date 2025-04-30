import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RotateCcw, Maximize2, Move, Info, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

interface ModelRendererProps {
  modelUrl: string;
  description: string;
}

export default function ModelRenderer({ modelUrl, description }: ModelRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [interactionMode, setInteractionMode] = useState<'rotate' | 'pan' | 'zoom'>('rotate');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelLoaded, setModelLoaded] = useState(true); // Set to true to skip loading state
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);
  const [rotationX, setRotationX] = useState(0);
  const [rotationY, setRotationY] = useState(0);
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  
  // For demonstration, implement a simple rotation system without Three.js
  useEffect(() => {
    // Start with a slight animation
    const interval = setInterval(() => {
      if (!isPanning) {
        setRotationY(prev => (prev + 0.5) % 360);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [isPanning]);
  
  // Handle mouse/touch interactions
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setDragStartX(e.clientX);
    setDragStartY(e.clientY);
    
    if (interactionMode === 'pan') {
      setIsPanning(true);
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return;
    
    const deltaX = e.clientX - dragStartX;
    const deltaY = e.clientY - dragStartY;
    
    if (interactionMode === 'rotate') {
      setRotationY(prev => (prev + deltaX * 0.5) % 360);
      setRotationX(prev => {
        const newVal = prev + deltaY * 0.5;
        return Math.max(-60, Math.min(60, newVal)); // Limit vertical rotation
      });
    } else if (interactionMode === 'zoom') {
      const newScale = scale + deltaY * -0.01;
      setScale(Math.max(0.5, Math.min(3, newScale))); // Limit zoom
    } else if (interactionMode === 'pan' && isPanning) {
      setPanX(prev => prev + deltaX * 0.5);
      setPanY(prev => prev + deltaY * 0.5);
    }
    
    setDragStartX(e.clientX);
    setDragStartY(e.clientY);
  };
  
  const handleMouseUp = () => {
    setIsPanning(false);
  };
  
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
    setRotationX(0);
    setRotationY(0);
    setScale(1);
    setPanX(0);
    setPanY(0);
  };
  
  const zoomIn = () => {
    setScale(prev => Math.min(3, prev + 0.1));
  };
  
  const zoomOut = () => {
    setScale(prev => Math.max(0.5, prev - 0.1));
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
        <Button onClick={() => window.location.reload()}>Try Again</Button>
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
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Interactive 3D-like model display */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{
            perspective: '1000px'
          }}
        >
          <div 
            className="w-64 h-64 bg-gradient-to-br from-primary to-primary/50 rounded-xl"
            style={{
              transform: `translateX(${panX}px) translateY(${panY}px) rotateY(${rotationY}deg) rotateX(${rotationX}deg) scale(${scale})`,
              transition: isPanning ? 'none' : 'transform 0.1s ease-out'
            }}
          >
            {/* Model front face */}
            <div className="absolute inset-0 flex items-center justify-center text-white font-bold">
              <div className="flex flex-col items-center">
                <div className="text-2xl mb-2">3D Model</div>
                <div className="text-sm">DC Motor</div>
                <div className="mt-4 animate-bounce">
                  <RefreshCw className="h-8 w-8" />
                </div>
              </div>
            </div>
            
            {/* Add 3D-like visual elements */}
            <div className="absolute inset-0 border-4 border-white/20 rounded-xl"></div>
            <div className="absolute top-0 left-0 w-full h-4 bg-white/10 rounded-t-xl"></div>
            <div className="absolute bottom-0 right-0 w-full h-4 bg-black/20 rounded-b-xl"></div>
          </div>
        </div>
        
        {/* Interaction mode indicator */}
        <div className="absolute top-4 left-4 bg-background/80 rounded-full px-3 py-1.5 text-sm font-medium">
          {interactionMode === 'rotate' && 'Rotate Mode'}
          {interactionMode === 'pan' && 'Pan Mode'}
          {interactionMode === 'zoom' && 'Zoom Mode'}
        </div>
        
        {/* Info button */}
        <Button 
          variant="secondary" 
          size="icon" 
          className="absolute top-4 right-4 rounded-full"
          onClick={() => setDescriptionOpen(true)}
        >
          <Info className="h-4 w-4" />
        </Button>
        
        {/* Quick zoom controls */}
        <div className="absolute bottom-20 right-4 flex flex-col gap-2">
          <Button variant="secondary" size="icon" onClick={zoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="icon" onClick={zoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
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
            {description || "This is a 3D model of a DC motor. DC motors are widely used in various applications requiring rotational motion, including robotics, industrial machinery, and consumer electronics."}
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </div>
  );
}
