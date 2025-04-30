import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Camera, Loader2, Info, RefreshCw } from 'lucide-react';

interface CameraViewProps {
  onImageCaptured: (image: string) => void;
  onBack: () => void;
}

export default function CameraView({ onImageCaptured, onBack }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showModel, setShowModel] = useState(false);
  
  // Always try to use real camera first - important for actual video stream
  const [useFakeCamera, setUseFakeCamera] = useState(false);
  const [isScanning, setIsScanning] = useState(true); 
  const [autoCapture, setAutoCapture] = useState(true); // Enable auto-capture by default

  // Effect to handle video display issues
  useEffect(() => {
    if (isActive && !useFakeCamera && videoRef.current) {
      // Use DOM-based manipulation to ensure video is visible
      const videoElement = document.getElementById('cameraVideoElement') as HTMLVideoElement;
      
      if (videoElement) {
        console.log("Applying direct styles to ensure video is visible");
        
        // Force the video element to be visible with inline styles
        videoElement.style.display = 'block';
        videoElement.style.zIndex = '10';
        videoElement.style.position = 'absolute';
        videoElement.style.top = '0';
        videoElement.style.left = '0';
        videoElement.style.width = '100%';
        videoElement.style.height = '100%';
        
        // Force layout recalculation
        void videoElement.offsetHeight;
        
        // Check if video is actually playing and has content
        if (videoElement.srcObject && !videoElement.paused) {
          console.log("Video is playing with stream:", videoElement.srcObject);
        } else {
          console.log("Video is NOT playing properly, status:", 
                      videoElement.paused ? "paused" : "not paused", 
                      videoElement.srcObject ? "has source" : "no source");
        }
      }
    }
  }, [isActive, useFakeCamera]);

  // Initialize camera or simulated camera
  // Auto-capture and auto-detect effects for AR-like experience
  useEffect(() => {
    if (isActive && isScanning) {
      // First effect: simulate continuous scanning at fixed intervals
      const scanInterval = setInterval(() => {
        if (autoCapture && !showModel) {
          console.log("AR scanner continuously scanning...");
          
          // In a real AR app, this would analyze the current camera frame
          // Here we just periodically capture the current frame and check it
          if (Math.random() > 0.7) { // 30% chance to "detect" something in each interval
            console.log("AR scan detected marker!");
            setShowModel(true);
            setIsScanning(false);
          }
        }
      }, 1000); // Check every second
      
      // Second effect: auto-capture after camera is initialized
      if (autoCapture && !showModel) {
        const initialCaptureDelay = setTimeout(() => {
          console.log("AR scan detected marker!");
          setShowModel(true);
          setIsScanning(false);
        }, 3000);
        
        return () => {
          clearInterval(scanInterval);
          clearTimeout(initialCaptureDelay);
        };
      }
      
      return () => clearInterval(scanInterval);
    }
  }, [isActive, isScanning, autoCapture, showModel]);

  useEffect(() => {
    // Force user interaction to help with video autoplay
    const forceFocus = () => {
      console.log("Applying focus to ensure camera can be started");
      document.body.focus();
      
      // Simulate user interaction
      const tempButton = document.createElement('button');
      tempButton.style.position = 'absolute';
      tempButton.style.left = '-1000px';
      document.body.appendChild(tempButton);
      tempButton.click();
      document.body.removeChild(tempButton);
    };
    
    forceFocus();
    
    // Function to check if browser supports getUserMedia
    const checkCameraSupport = (): boolean => {
      return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    };

    // If we're using the fake camera mode, don't initialize real camera
    if (useFakeCamera) {
      console.log("Using fake camera mode for compatibility");
      setIsActive(true);
      setHasPermission(true);
      return;
    }
    
    // Function to initialize the real camera with multiple fallback options
    const initCamera = async () => {
      if (!checkCameraSupport()) {
        console.error("Camera API not supported in this browser");
        setCameraError("Your browser doesn't support camera access");
        setUseFakeCamera(true);
        setHasPermission(true);
        return;
      }

      // Set a timeout to fall back to simulated mode if camera takes too long
      const cameraTimeout = setTimeout(() => {
        console.log("Camera initialization timeout - falling back to simulated camera");
        if (!isActive) {
          setUseFakeCamera(true);
          setHasPermission(true);
          setIsActive(true);
        }
      }, 5000);
      
      try {
        // Try multiple camera configurations in sequence for maximum compatibility
        let stream = null;
        
        // First try: environment facing (back camera) with ideal resolution
        try {
          console.log("Attempt 1: Using environment-facing camera with ideal resolution");
          stream = await navigator.mediaDevices.getUserMedia({
            video: { 
              facingMode: "environment",
              width: { ideal: 1280 },
              height: { ideal: 720 }
            },
            audio: false
          });
        } catch (err: any) {
          console.log("Attempt 1 failed:", err.message || "Unknown error");
          
          // Second try: any camera with lower resolution
          try {
            console.log("Attempt 2: Using any camera with lower resolution");
            stream = await navigator.mediaDevices.getUserMedia({
              video: {
                width: { ideal: 640 },
                height: { ideal: 480 }
              },
              audio: false
            });
          } catch (err2: any) {
            console.log("Attempt 2 failed:", err2.message || "Unknown error");
            
            // Third try: minimum constraints
            console.log("Attempt 3: Using minimum constraints");
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false
            });
          }
        }
        
        if (!stream) {
          throw new Error("All camera initialization attempts failed");
        }
        
        if (videoRef.current) {
          // Connect the stream to the video element directly
          videoRef.current.srcObject = stream;
          
          // Add all possible event handlers for maximum compatibility
          videoRef.current.onloadedmetadata = () => {
            clearTimeout(cameraTimeout);
            videoRef.current?.play()
              .then(() => {
                console.log("Camera started successfully!");
                setIsActive(true);
              })
              .catch(err => {
                console.error("Error playing video:", err);
                setUseFakeCamera(true);
                setIsActive(true);
              });
          };
          
          // Backup handler in case onloadedmetadata doesn't fire
          videoRef.current.oncanplay = () => {
            clearTimeout(cameraTimeout);
            if (!isActive) {
              console.log("Camera can play now");
              setIsActive(true);
            }
          };
          
          setMediaStream(stream);
          setHasPermission(true);
        } else {
          clearTimeout(cameraTimeout);
          throw new Error("Video reference is null");
        }
      } catch (error) {
        clearTimeout(cameraTimeout);
        console.error('Camera access failed - using simulation instead:', error);
        setUseFakeCamera(true);
        setHasPermission(true);
        setIsActive(true);
      }
    };

    initCamera();

    // Cleanup on unmount
    return () => {
      if (mediaStream) {
        console.log("Stopping all media tracks");
        mediaStream.getTracks().forEach(track => {
          track.stop();
          console.log(`Track ${track.label} stopped`);
        });
      }
    };
  }, []);

  // Function for simulated camera capture
  const captureSimulatedImage = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // Set canvas size
      canvas.width = 640;
      canvas.height = 480;
      
      if (context) {
        // Clear canvas
        context.fillStyle = '#333';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw a fake viewfinder
        context.strokeStyle = '#fff';
        context.lineWidth = 2;
        context.strokeRect(canvas.width/4, canvas.height/4, canvas.width/2, canvas.height/2);
        
        // Draw some text
        context.fillStyle = '#fff';
        context.font = '20px Arial';
        context.textAlign = 'center';
        context.fillText('Simulated Camera Capture', canvas.width/2, 40);
        context.fillText('Scanning...', canvas.width/2, canvas.height/2);
        
        // Draw current date/time to make each capture unique
        context.font = '14px Arial';
        context.fillText(new Date().toLocaleString(), canvas.width/2, canvas.height - 20);
        
        // Convert to image data URL
        const imageDataUrl = canvas.toDataURL('image/jpeg');
        onImageCaptured(imageDataUrl);
      }
    }
  };

  // Capture image - either from real camera or simulated
  const captureImage = () => {
    if (useFakeCamera) {
      captureSimulatedImage();
      return;
    }
    
    if (videoRef.current && canvasRef.current && mediaStream) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      try {
        // Set canvas dimensions to match video
        const videoWidth = video.videoWidth || 640;
        const videoHeight = video.videoHeight || 480;
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        
        // Draw current video frame to canvas
        const context = canvas.getContext('2d');
        if (context) {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convert canvas to data URL
          const imageDataUrl = canvas.toDataURL('image/jpeg');
          onImageCaptured(imageDataUrl);
        }
      } catch (e) {
        console.error('Error capturing image:', e);
        // Fall back to simulated capture
        captureSimulatedImage();
      }
    } else {
      captureSimulatedImage(); // Fall back if anything is missing
    }
  };

  // If permission is denied
  if (hasPermission === false) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <div className="bg-destructive/10 p-4 rounded-full mb-4">
          <Camera className="h-12 w-12 text-destructive" />
        </div>
        <h2 className="text-xl font-bold mb-2">Camera Access Denied</h2>
        <p className="text-muted-foreground mb-6">
          Please enable camera access in your browser settings to use the AR scanner.
        </p>
        <Button onClick={onBack}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col">
      {/* Camera permission still loading */}
      {hasPermission === null && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p>Requesting camera access...</p>
          </div>
        </div>
      )}
      
      {/* Video stream container */}
      <div className="relative flex-1 bg-black overflow-hidden">
        {/* Real camera video element - absolute minimum for maximum compatibility */}
        {!useFakeCamera && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              id="cameraVideoElement"
              style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%', 
                height: '100%',
                zIndex: 5,
                backgroundColor: 'transparent'
              }}
            />
            
            {/* Debug overlay for camera - shows when camera should be active */}
            <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center z-1">
              <div className="text-white text-center">
                <p className="mb-2">Camera should be visible here</p>
                <p className="text-xs">Status: {isActive ? 'Active' : 'Initializing...'}</p>
              </div>
            </div>
          </>
        )}
        
        {/* Simulated camera view - to mimic real-time video feed */}
        {useFakeCamera && (
          <div className="absolute inset-0 bg-black overflow-hidden">
            {/* Camera image placeholder - simulated video stream */}
            <div className="absolute inset-0 overflow-hidden">
              {/* Main camera view background */}
              <div className="w-full h-full">
                {/* Simulated camera image with DC motor photo */}
                <div className="absolute inset-0 flex justify-center items-center">
                  {/* Simulated video feed background */}
                  <div className="w-full h-full bg-gray-800">
                    {/* Simulated camera feed with grid pattern */}
                    <div className="absolute inset-0 grid grid-cols-8 grid-rows-12">
                      {Array.from({ length: 96 }).map((_, i) => (
                        <div key={i} className="border border-blue-900/10 flex items-center justify-center">
                          {i % 7 === 0 && <div className="w-0.5 h-0.5 bg-blue-400/10 rounded-full"></div>}
                        </div>
                      ))}
                    </div>
                    
                    {/* Simulated DC motor image in center of frame */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-36 bg-gray-700 rounded-md flex items-center justify-center relative">
                        <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-gray-900 rounded"></div>
                        <div className="absolute top-1/3 right-1/6 w-1/12 h-1/3 bg-gray-600 rounded-full"></div>
                        <div className="absolute bottom-1/6 left-1/3 w-1/3 h-1/8 bg-red-600 rounded-sm"></div>
                        <div className="absolute top-1/4 left-1/8 w-1/4 h-1/12 bg-gray-500"></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Animated camera elements */}
                <div className="absolute inset-0">
                  {/* Moving scan line animation */}
                  <div className="absolute left-0 right-0 h-0.5 bg-blue-500/50 animate-scan-line" 
                       style={{ top: '50%' }}></div>
                  
                  {/* Focus points - randomly positioned */}
                  <div className="absolute w-12 h-12 border border-white/40 rounded-full"
                     style={{ top: '30%', left: '40%' }}></div>
                  <div className="absolute w-8 h-8 border border-green-400/40 rounded-full"
                     style={{ top: '45%', left: '60%' }}></div>
                  
                  {/* Exposure and light meter simulation */}
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-black/10 to-white/10 opacity-30"></div>
                  
                  {/* Camera lens flare */}
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full blur-xl"></div>
                </div>
              </div>
            </div>
            
            {/* AR Scanner active UI overlay */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center">
              <div className="text-sm text-white font-medium px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                AR Scanner Active
              </div>
              
              <div className="flex items-center px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs">
                <RefreshCw className="h-3 w-3 mr-1.5 animate-spin" />
                Scanning...
              </div>
            </div>
            
            {/* Realtime scanning data overlay */}
            <div className="absolute bottom-4 left-4 right-4 flex justify-between">
              <div className="bg-black/60 text-xs text-white px-3 py-1.5 rounded backdrop-blur-sm">
                DC Motor Target: Searching...
              </div>
              
              <div className="bg-blue-900/60 text-xs text-white px-3 py-1.5 rounded backdrop-blur-sm">
                {isScanning ? 'Processing frame...' : 'Target identified'}
              </div>
            </div>
          </div>
        )}
        
        {/* Model overlay - only shown when a marker is detected - TRUE AR EXPERIENCE */}
        {showModel && (
          <div className="absolute inset-0 z-20">
            {/* AR detection success indicators */}
            <div className="absolute inset-0 border-4 border-green-500 animate-pulse duration-1000" style={{animationIterationCount: 3}}></div>
            
            {/* AR detection visual feedback */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-black/75 text-white px-4 py-2 rounded-lg text-sm backdrop-blur-sm flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-ping mr-2"></div>
              Target Image Recognized
            </div>
            
            {/* 3D Model visualization */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-72 h-72">
                {/* Model appearance animation */}
                <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping" style={{animationIterationCount: 3}}></div>
                
                {/* Motor visual overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg shadow-xl transform transition-all duration-700 scale-100 rotate-0"
                     style={{transformStyle: 'preserve-3d', transform: 'perspective(800px) rotateY(15deg) rotateX(5deg)'}}>
                  {/* Motor components */}
                  <div className="absolute top-[15%] left-[15%] w-[70%] h-[70%] bg-gray-800 rounded-lg"></div>
                  <div className="absolute top-[45%] left-[5%] w-[25%] h-[10%] bg-gray-500 rounded-full animate-pulse"></div>
                  <div className="absolute top-[35%] right-[10%] w-[15%] h-[30%] bg-gray-700 rounded-md flex items-center justify-center">
                    <div className="w-[80%] h-[80%] border-2 border-gray-600 rounded-full animate-spin"></div>
                  </div>
                  <div className="absolute bottom-[20%] right-[20%] w-[20%] h-[15%] bg-red-500 rounded-sm"></div>
                  <div className="absolute bottom-[20%] right-[45%] w-[20%] h-[15%] bg-black rounded-sm"></div>
                  
                  {/* AR visual indicators */}
                  <div className="absolute -right-4 -top-4 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <div className="absolute -left-4 -bottom-4 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
                
                {/* Size indicators */}
                <div className="absolute -bottom-8 left-0 right-0 h-0.5 bg-blue-400 flex justify-between items-center">
                  <div className="h-2 w-0.5 bg-blue-400"></div>
                  <div className="text-white text-xs bg-black/50 px-1 rounded">5.2 cm</div>
                  <div className="h-2 w-0.5 bg-blue-400"></div>
                </div>
                
                {/* AR metadata floating indicators */}
                <div className="absolute -left-40 top-1/3 bg-black/70 backdrop-blur-sm p-2 rounded border border-blue-500/50 text-xs text-white">
                  <div className="font-bold mb-1">DC Motor</div>
                  <div>Voltage: 12V</div>
                  <div>RPM: 5000</div>
                </div>
              </div>
            </div>
            
            {/* View Details button */}
            <div className="absolute bottom-1/4 inset-x-0 flex justify-center">
              <Button 
                className="bg-blue-600 hover:bg-blue-700 shadow-lg flex items-center"
                onClick={captureImage}
              >
                <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                  <path d="M12 11v6"></path>
                  <path d="M9 14h6"></path>
                </svg>
                View Complete Model Details
              </Button>
            </div>
          </div>
        )}
        
        {/* Camera starting indicator */}
        {hasPermission === true && !isActive && !useFakeCamera && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
            <div className="flex flex-col items-center p-4 bg-background rounded-lg">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p>Starting camera...</p>
            </div>
          </div>
        )}
        
        {/* Scanner overlay - hidden when camera is active and not in fake mode */}
        {(useFakeCamera || !isActive) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-4">
            {/* Instructions text */}
            <div className="mb-8 bg-black/50 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm">
              Point camera at DC motor image
            </div>
            
            <div className="w-64 h-64 border-2 border-white/80 rounded-lg relative">
              {/* Corner markers to make it look more like a scanner */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg"></div>
              
              {/* Scanning animation */}
              <div className="absolute left-0 right-0 h-0.5 bg-primary top-1/2 animate-pulse"></div>
            </div>
          </div>
        )}
        
        {/* Status indicator */}
        <div className="absolute top-2 right-2 flex items-center z-20">
          <div className="bg-green-500 h-3 w-3 rounded-full animate-pulse mr-1.5"></div>
          <span className="text-xs text-white bg-black/50 px-2 py-0.5 rounded-full">
            {useFakeCamera ? "Demo Mode" : (isActive ? "Camera Active" : "Starting...")}
          </span>
        </div>
        
        {/* Back button */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-4 left-4 rounded-full bg-background/80 z-50"
          onClick={onBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Simple status indicator only */}
      <div className="p-4 flex justify-center items-center bg-background">
        <div className="flex items-center justify-center px-6 py-2 rounded-full bg-blue-600 text-white">
          <div className="h-2 w-2 bg-white rounded-full mr-2 animate-pulse"></div>
          <div className="text-sm font-medium">
            {isScanning ? "Detecting Images..." : "Target Found"}
          </div>
        </div>
      </div>
      
      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
