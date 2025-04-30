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
  const [useFakeCamera, setUseFakeCamera] = useState(false);

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

  // Capture image from video stream
  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw current video frame to canvas
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to data URL (base64 encoded image)
        const imageDataUrl = canvas.toDataURL('image/jpeg');
        onImageCaptured(imageDataUrl);
      }
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
      
      {/* Video stream */}
      <div className="relative flex-1 bg-black overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover z-0"
          autoPlay
          playsInline
          muted
          style={{ width: '100%', height: '100%' }}
        />
        
        {/* Camera status indicator */}
        {hasPermission === true && !isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
            <div className="flex flex-col items-center p-4 bg-background rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-2"></div>
              <p>Starting camera...</p>
            </div>
          </div>
        )}
        
        {/* Scanner overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 border-2 border-white/80 rounded-lg"></div>
          {isActive && (
            <div className="absolute top-2 right-2 bg-green-500 h-2 w-2 rounded-full animate-pulse" 
                 title="Camera active"></div>
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
          disabled={!isActive}
        >
          <Camera className="h-8 w-8" />
        </Button>
      </div>
      
      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
