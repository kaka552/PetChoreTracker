import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Camera, Loader2 } from 'lucide-react';

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
  
  // Start with fake camera on by default for more consistent experience on mobile
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
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white">
            <div className="text-center p-4">
              <Camera className="h-16 w-16 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">AR Scanner Ready</h3>
              <p className="text-sm text-gray-300 mb-4">
                {cameraError ? 
                  `Camera Error: ${cameraError}. Using demo mode.` : 
                  "Demo mode activated. Take a picture to simulate AR scanning."}
              </p>
              <div className="w-64 h-1 bg-primary/30 relative mx-auto">
                <div className="absolute top-0 left-0 h-full w-1/2 bg-primary animate-pulse"></div>
              </div>
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
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-64 h-64 border-2 border-white/80 rounded-lg">
            {/* Corner markers to make it look more like a scanner */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg"></div>
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
          className="absolute top-4 left-4 rounded-full bg-background/80"
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
