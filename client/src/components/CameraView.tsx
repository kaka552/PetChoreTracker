import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Camera, RefreshCw } from 'lucide-react';
import ModelRenderer from './ModelRenderer';

// Define the model type
interface ModelType {
  id: number;
  model_name: string;
  image_target?: string;
  model_file_url?: string;
  description?: string;
  [key: string]: any;
}

interface CameraViewProps {
  onImageCaptured: (image: string) => void;
  onBack: () => void;
  models?: ModelType[];
}

export default function CameraView({ onImageCaptured, onBack, models = [] }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [showModel, setShowModel] = useState(false);
  const [recognizedModel, setRecognizedModel] = useState<ModelType | null>(null);
  
  // Initialize camera on component mount
  useEffect(() => {
    let mounted = true;
    
    async function setupCamera() {
      try {
        // Request camera access
        const constraints = { 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        };
        
        console.log("Starting camera with constraints:", constraints);
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (videoRef.current && mounted) {
          // Connect stream to video element
          videoRef.current.srcObject = stream;
          
          // Add attributes for mobile compatibility
          videoRef.current.setAttribute("playsinline", "true");
          videoRef.current.setAttribute("autoplay", "true");
          videoRef.current.muted = true;
          
          try {
            await videoRef.current.play();
            console.log("Camera started successfully");
            setHasCamera(true);
          } catch (playError) {
            console.error("Error playing video:", playError);
            setHasCamera(false);
          }
        }
      } catch (error) {
        console.error("Camera access error:", error);
        setHasCamera(false);
      }
    }
    
    setupCamera();
    
    // Cleanup function
    return () => {
      mounted = false;
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach(track => {
          track.stop();
          console.log(`Camera track stopped: ${track.label}`);
        });
      }
    };
  }, []);
  
  // Function to manually scan and recognize an image
  const scanForImages = () => {
    if (!models || models.length === 0) {
      console.warn("No models available to match against");
      return;
    }
    
    // Log available models
    console.log(`Scanning against ${models.length} available models:`);
    models.forEach((model, index) => {
      console.log(`Model ${index}: ${model.model_name}`);
    });
    
    // For demo purposes, always match the first model
    const matchedModel = models[0];
    console.log(`Using model: ${matchedModel.model_name}`);
    
    // Update state
    setIsScanning(false);
    setRecognizedModel(matchedModel);
    setShowModel(true);
  };
  
  // Reset scanning state
  const resetScan = () => {
    setShowModel(false);
    setIsScanning(true);
    setRecognizedModel(null);
  };
  
  // Capture current camera frame to canvas
  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas size to match video
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    // Draw current video frame to canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg');
    }
    
    return null;
  };
  
  // Take a photo and pass to parent component
  const captureImage = () => {
    const imageData = captureFrame();
    if (imageData) {
      onImageCaptured(imageData);
    }
  };
  
  // Camera permission denied UI
  if (hasCamera === false) {
    return (
      <div className="flex flex-col items-center justify-center p-4 h-full text-center">
        <Camera className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Camera Access Required</h2>
        <p className="mb-4">Please allow camera access to use the AR scanner.</p>
        <Button onClick={onBack}>Back to Home</Button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full relative">
      {/* Main container with camera view */}
      <div className="relative flex-1 overflow-hidden bg-black">
        {/* Video element - minimal styling for maximum compatibility */}
        <video 
          ref={videoRef}
          autoPlay 
          playsInline
          muted
          id="camera-video"
          style={{
            width: '100%', 
            height: '100%',
            objectFit: 'cover',
            display: 'block'
          }}
        />
        
        {/* Camera loading state */}
        {hasCamera === null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
              <p className="text-white">Starting camera...</p>
            </div>
          </div>
        )}
        
        {/* Either show the scanning UI or the model view, never both */}
        {showModel && recognizedModel ? (
          <div className="absolute inset-0 z-20 bg-black/80">
            {/* Recognition success indicator */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-full text-sm flex items-center z-30">
              <div className="w-2 h-2 bg-white rounded-full animate-ping mr-2"></div>
              Target Recognized: {recognizedModel.model_name}
            </div>
            
            {/* 3D Model renderer */}
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="relative w-full h-full max-w-lg mx-auto bg-gray-900 rounded-lg overflow-hidden">
                <ModelRenderer 
                  modelUrl={recognizedModel.model_file_url || ""}
                  description={recognizedModel.description || ""}
                />
              </div>
            </div>
            
            {/* Reset scan button */}
            <Button
              variant="secondary"
              className="absolute bottom-4 right-4 bg-background/80 rounded-full z-30"
              onClick={resetScan}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              New Scan
            </Button>
          </div>
        ) : (
          <div className="absolute inset-0 z-10">
            {/* Camera viewfinder and scan guidance */}
            <div className="pointer-events-none flex flex-col items-center justify-center h-full">
              <div className="text-white bg-black/40 px-4 py-2 rounded-lg mb-4 text-center shadow-lg">
                Point camera at target image and tap SCAN
              </div>
              
              {/* Scanner visual - completely transparent except for borders */}
              <div className="w-64 h-64 border-2 border-white/50 rounded-md relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-500"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-500"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-500"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-500"></div>
                
                {/* Scan line animation */}
                {isScanning && (
                  <div className="absolute left-0 right-0 h-0.5 bg-blue-500 animate-pulse" style={{ top: '50%' }}></div>
                )}
              </div>
            </div>
            
            {/* Active scan button - center bottom */}
            <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2">
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-full shadow-lg pointer-events-auto"
                onClick={scanForImages}
                size="lg"
              >
                <div className="text-lg font-semibold">SCAN IMAGE</div>
              </Button>
            </div>
          </div>
        )}
        
        {/* Back button - always visible */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-4 left-4 rounded-full bg-black/50 z-50"
          onClick={onBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden"></canvas>
    </div>
  );
}