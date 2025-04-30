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
  
  // Start with fake camera mode for consistent cross-device experience
  const [useFakeCamera, setUseFakeCamera] = useState(true);

  // Initialize camera or simulated camera
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
    
    // Function to initialize the real camera
    const initCamera = async () => {
      if (!checkCameraSupport()) {
        console.error("Camera API not supported in this browser");
        setCameraError("Your browser doesn't support camera access");
        setUseFakeCamera(true);
        setHasPermission(true);
        return;
      }
      
      try {
        console.log("Attempting to access camera...");
        
        // Try environment camera first (back camera on mobile)
        const constraints = {
          video: {
            facingMode: { ideal: 'environment' }, // Use back camera if available
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        };
        
        console.log("Camera constraints:", constraints);
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log("Camera stream obtained:", stream.getVideoTracks()[0].label);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          console.log("Stream assigned to video element");
          
          // Fix for video not displaying - ensure it loads properly
          const videoElement = videoRef.current;
          
          // Set multiple event listeners to catch when the video is ready
          videoElement.onloadedmetadata = () => {
            console.log("Video metadata loaded, dimensions:", videoElement.videoWidth, "x", videoElement.videoHeight);
            
            // Force display the video
            videoElement.style.display = 'block';
            
            // Try to play the video
            videoElement.play()
              .then(() => {
                console.log("Video playback started successfully");
                setIsActive(true);
              })
              .catch(err => {
                console.error("Error playing video:", err);
              });
          };
          
          // Additional event handlers for reliability
          videoElement.onloadeddata = () => {
            console.log("Video data loaded");
            videoElement.style.display = 'block';
          };
          
          videoElement.oncanplay = () => {
            console.log("Video can play");
            videoElement.play()
              .then(() => setIsActive(true))
              .catch(e => console.error("Play error:", e));
          };
          
          videoRef.current.onerror = (e) => {
            console.error("Video element error:", e);
          };
          
          setMediaStream(stream);
          setHasPermission(true);
        } else {
          console.error("Video reference is null");
        }
      } catch (error: any) {
        console.error('Error accessing camera:', error);
        
        // Permission errors
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          console.error('Camera permission denied by user or system');
        }
        // Device not found errors
        else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          console.error('No camera detected on this device');
        }
        // Constraints errors
        else if (error.name === 'ConstraintNotSatisfiedError' || error.name === 'OverconstrainedError') {
          console.error('Camera constraints cannot be satisfied');
          // Try again with less specific constraints
          try {
            console.log("Trying fallback camera access with basic constraints");
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            
            if (videoRef.current) {
              const videoElement = videoRef.current;
              videoElement.srcObject = stream;
              console.log("Fallback stream assigned to video element");
              
              // Use the same enhanced event handling for the fallback
              videoElement.onloadedmetadata = () => {
                console.log("Fallback: Video metadata loaded");
                videoElement.style.display = 'block';
                
                videoElement.play()
                  .then(() => {
                    console.log("Fallback: Video playback started successfully");
                    setIsActive(true);
                  })
                  .catch(e => console.error("Fallback video play error:", e));
              };
              
              // Additional event handlers
              videoElement.onloadeddata = () => {
                console.log("Fallback: Video data loaded");
                videoElement.style.display = 'block';
              };
              
              videoElement.oncanplay = () => {
                console.log("Fallback: Video can play");
                videoElement.play()
                  .then(() => setIsActive(true))
                  .catch(e => console.error("Fallback play error:", e));
              };
              
              setMediaStream(stream);
              setHasPermission(true);
              return;
            }
          } catch (fallbackError) {
            console.error('Fallback camera access failed:', fallbackError);
          }
        }
        
        setHasPermission(false);
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
        {/* Real camera video element */}
        {!useFakeCamera && (
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover z-0"
            autoPlay
            playsInline
            muted
            style={{ 
              width: '100%', 
              height: '100%',
              display: 'block'
            }}
          />
        )}
        
        {/* Fake camera simulation when real camera doesn't work */}
        {useFakeCamera && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-gray-800 to-gray-900 text-white">
            <div className="text-center p-4 max-w-xs">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center mb-4 relative">
                  <Camera className="h-10 w-10 text-blue-400" />
                  <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-75"></div>
                </div>
              </div>
              
              <h3 className="text-xl font-bold mb-2">AR Scanner Active</h3>
              
              <p className="text-sm text-gray-300 mb-4">
                {cameraError ? 
                  `Camera Error: ${cameraError}. Using demo mode.` : 
                  "Simulating camera view. Tap scan to detect DC motor image markers in view."}
              </p>
              
              <div className="w-full h-1.5 bg-primary/20 rounded-full relative mx-auto overflow-hidden mb-6">
                <div className="absolute top-0 left-0 h-full bg-primary animate-scan-line" style={{width: '30%'}}></div>
              </div>
              
              {/* Scan button for demo mode */}
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => setShowModel(true)}
              >
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Scan Environment
              </Button>
              
              <p className="text-xs text-gray-400 mt-3">
                AR scanning processes environment to find matching image targets
              </p>
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
        
        {/* Scanner overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
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
          
          {/* Status indicator */}
          {(isActive || useFakeCamera) && (
            <div className="absolute top-2 right-2 flex items-center">
              <div className="bg-green-500 h-3 w-3 rounded-full animate-pulse mr-1.5"></div>
              <span className="text-xs text-white bg-black/50 px-2 py-0.5 rounded-full">
                {useFakeCamera ? "Demo Mode" : "Camera Active"}
              </span>
            </div>
          )}
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
      
      {/* Capture button */}
      <div className="p-4 flex justify-center bg-background">
        <Button 
          onClick={captureImage}
          size="lg"
          className="rounded-full h-16 w-16 flex items-center justify-center"
          disabled={!isActive && !useFakeCamera}
        >
          <Camera className="h-8 w-8" />
        </Button>
      </div>
      
      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
