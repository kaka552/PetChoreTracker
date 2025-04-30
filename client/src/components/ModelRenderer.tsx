import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RotateCcw, Move, Info, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

interface ModelRendererProps {
  modelUrl: string;
  description: string;
}

export default function ModelRenderer({ modelUrl, description }: ModelRendererProps) {
  // Refs and state
  const containerRef = useRef<HTMLDivElement>(null);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [interactionMode, setInteractionMode] = useState<'rotate' | 'pan' | 'zoom'>('rotate');
  const [rotationX, setRotationX] = useState(0);
  const [rotationY, setRotationY] = useState(0);
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  
  // Track mouse/touch position for interaction
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  
  // Animate initial rotation
  useEffect(() => {
    if (!isPanning) {
      const interval = setInterval(() => {
        setRotationY(prev => (prev + 0.5) % 360);
      }, 100);
      
      // Stop automatic rotation after 2 seconds
      const timeout = setTimeout(() => {
        clearInterval(interval);
      }, 2000);
      
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, []);
  
  // Mouse/touch interaction handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    setStartPos({ x: e.clientX, y: e.clientY });
    
    if (interactionMode === 'pan') {
      setIsPanning(true);
    }
    
    // Capture pointer to track moves outside element
    if (containerRef.current) {
      containerRef.current.setPointerCapture(e.pointerId);
    }
  };
  
  const handlePointerMove = (e: React.PointerEvent) => {
    // Skip if not pressed
    if (e.buttons !== 1) return;
    
    const deltaX = e.clientX - startPos.x;
    const deltaY = e.clientY - startPos.y;
    
    // Apply changes based on interaction mode
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
    
    setStartPos({ x: e.clientX, y: e.clientY });
  };
  
  const handlePointerUp = (e: React.PointerEvent) => {
    setIsPanning(false);
    
    // Release pointer capture
    if (containerRef.current) {
      containerRef.current.releasePointerCapture(e.pointerId);
    }
  };
  
  // Handle double tap to show description
  const handleDoubleTap = () => {
    setInfoDialogOpen(true);
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
  
  // Zoom control functions
  const zoomIn = () => {
    setScale(prev => Math.min(3, prev + 0.1));
  };
  
  const zoomOut = () => {
    setScale(prev => Math.max(0.5, prev - 0.1));
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* 3D viewer */}
      <div 
        ref={containerRef}
        className="flex-1 relative bg-gray-900 rounded-lg overflow-hidden"
        onDoubleClick={handleDoubleTap}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ touchAction: 'none' }} // Prevent browser handling of gestures
      >
        {/* 3D-like model display with perspective */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ perspective: '1000px' }}
        >
          <div 
            className="w-64 h-64 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl shadow-xl"
            style={{
              transform: `translateX(${panX}px) translateY(${panY}px) rotateY(${rotationY}deg) rotateX(${rotationX}deg) scale(${scale})`,
              transition: isPanning ? 'none' : 'transform 0.1s ease-out'
            }}
          >
            {/* DC Motor model components */}
            <div className="absolute inset-0 border-4 border-white/20 rounded-xl"></div>
            
            {/* Motor casing */}
            <div className="absolute top-[15%] left-[15%] w-[70%] h-[70%] bg-gray-800 rounded-lg"></div>
            
            {/* Motor shaft */}
            <div className="absolute top-[45%] left-[5%] w-[25%] h-[10%] bg-gray-500 rounded-full animate-pulse"></div>
            
            {/* Motor rear (ventilation) */}
            <div className="absolute top-[35%] right-[10%] w-[15%] h-[30%] bg-gray-700 rounded-md flex items-center justify-center">
              <div className="w-[80%] h-[80%] border-2 border-gray-600 rounded-full animate-spin"></div>
            </div>
            
            {/* Connection wires */}
            <div className="absolute bottom-[20%] right-[20%] w-[20%] h-[15%] bg-red-500 rounded-sm"></div>
            <div className="absolute bottom-[20%] right-[45%] w-[20%] h-[15%] bg-black rounded-sm"></div>
            
            {/* Highlights */}
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
          className="absolute top-4 right-4 rounded-full bg-background/80"
          onClick={() => setInfoDialogOpen(true)}
        >
          <Info className="h-4 w-4" />
        </Button>
        
        {/* Quick zoom controls */}
        <div className="absolute bottom-20 right-4 flex flex-col gap-2">
          <Button variant="secondary" size="icon" onClick={zoomIn} className="bg-background/80">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="icon" onClick={zoomOut} className="bg-background/80">
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Instructions */}
        <div className="absolute bottom-4 left-4 right-4 bg-background/80 backdrop-blur-sm rounded-lg p-2 text-xs text-center">
          Drag to {interactionMode}. Double tap for description.
        </div>
      </div>
      
      {/* Controls */}
      <div className="p-3 bg-gray-800 rounded-b-lg flex justify-between">
        <div className="flex space-x-2">
          <Button 
            variant={interactionMode === 'rotate' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => changeMode('rotate')}
            className={interactionMode === 'rotate' ? 'bg-blue-600' : ''}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Rotate
          </Button>
          <Button 
            variant={interactionMode === 'pan' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => changeMode('pan')}
            className={interactionMode === 'pan' ? 'bg-blue-600' : ''}
          >
            <Move className="h-4 w-4 mr-1" />
            Pan
          </Button>
          <Button 
            variant={interactionMode === 'zoom' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => changeMode('zoom')}
            className={interactionMode === 'zoom' ? 'bg-blue-600' : ''}
          >
            <ZoomIn className="h-4 w-4 mr-1" />
            Zoom
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={resetView}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Reset
        </Button>
      </div>
      
      {/* Model description dialog */}
      <Dialog open={infoDialogOpen} onOpenChange={setInfoDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>DC Motor - Model Information</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            {description || 
              "This is a 3D model of a DC motor. DC motors are widely used in various applications requiring rotational motion, including robotics, industrial machinery, and consumer electronics. The model shows key components including the motor housing, shaft, and electrical connections."}
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </div>
  );
}