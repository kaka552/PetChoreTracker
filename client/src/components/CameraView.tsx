import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Camera } from 'lucide-react';

interface CameraViewProps {
  onImageCaptured: (image: string) => void;
  onBack: () => void;
}

export default function CameraView({ onImageCaptured, onBack }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [showModel, setShowModel] = useState(false);
  
  // State for manual scanning
  const [recognizedModel, setRecognizedModel] = useState<any>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  
  // Manual scan button function (more reliable than auto-detection)
  const scanForImages = () => {
    setIsScanning(false);
    
    if (models && models.length > 0) {
      console.log("Scanning image against available models:");
      models.forEach((model, index) => {
        console.log(`Model ${index}: ${model.model_name}`);
      });
      
      // Load the first model
      setRecognizedModel(models[0]);
      setScanResult(`Found: ${models[0].model_name}`);
      setShowModel(true);
    } else {
      console.warn("No models available to match against");
      setScanResult("No models available");
    }
  };
  
  // Initialize camera as simply as possible
  useEffect(() => {
    async function setupCamera() {
      try {
        const constraints = { 
          video: { 
            facingMode: 'environment' 
          } 
        };
        
        console.log("Starting camera with constraints:", constraints);
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          videoRef.current.play();
          setHasCamera(true);
          console.log("Camera started successfully");
        }
      } catch (error) {
        console.error("Camera error:", error);
        setHasCamera(false);
      }
    }
    
    setupCamera();
    
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);
  
  // Take a photo from the camera stream
  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas to video dimensions
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      // Draw video frame to canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg');
        onImageCaptured(imageData);
      }
    }
  };
  
  // If camera permission denied
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
    <div className="flex flex-col h-full relative bg-black">
      {/* Full-size video container */}
      <div className="relative flex-1 overflow-hidden bg-gray-900">
        {/* Main video element - absolute minimal styling */}
        <video 
          ref={videoRef}
          autoPlay 
          playsInline
          muted
          id="camera-video"
          width="100%"
          height="100%"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 10,
            backgroundColor: '#000'
          }}
        />
        
        {/* AR Detection UI */}
        {showModel && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="relative w-72 h-72 bg-blue-500/20 rounded-lg border-2 border-blue-500 flex items-center justify-center">
              {/* 3D Model (simplified) */}
              <div className="w-64 h-64 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg shadow-lg p-4 transform rotate-12">
                <div className="absolute top-2 left-2 right-2 bg-black/70 text-white text-sm p-2 rounded">
                  DC Motor - 12V 5000RPM
                </div>
                <div className="h-full flex items-center justify-center">
                  <div className="w-32 h-32 bg-gray-800 rounded-full relative">
                    <div className="absolute inset-4 bg-gray-700 rounded-full border-4 border-gray-600"></div>
                    <div className="absolute top-1/4 left-1/2 w-2 h-12 bg-red-500 origin-bottom transform -translate-x-1/2 rotate-45 animate-spin"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Camera loading state */}
        {hasCamera === null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
              <p className="text-white">Starting camera...</p>
            </div>
          </div>
        )}
        
        {/* Scan overlay */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center" style={{ zIndex: 5 }}>
          <div className="text-white bg-black/40 px-4 py-2 rounded-full mb-4">
            Point camera at DC motor image
          </div>
          
          <div className="w-64 h-64 border-2 border-white rounded-md">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-500"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-500"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-500"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-500"></div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="bg-gray-900 p-4 flex justify-between items-center">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={onBack}
          className="rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        {isScanning ? (
          <Button 
            onClick={scanForImages} 
            className="rounded-full bg-blue-600 hover:bg-blue-700 flex items-center"
          >
            <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
            Scan Image
          </Button>
        ) : (
          <div className="text-white text-sm px-4 py-1 bg-green-600 rounded-full flex items-center">
            <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
            {scanResult || "Target found"}
          </div>
        )}
        
        {!isScanning && (
          <Button onClick={captureImage} className="rounded-full bg-green-600 hover:bg-green-700">
            View Model
          </Button>
        )}
      </div>
      
      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden"></canvas>
    </div>
  );
}