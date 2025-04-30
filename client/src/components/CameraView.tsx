import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Camera } from 'lucide-react';

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

  // Initialize camera
  useEffect(() => {
    // Function to check if browser supports getUserMedia
    const checkCameraSupport = (): boolean => {
      return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    };

    // Function to initialize the camera
    const initCamera = async () => {
      if (!checkCameraSupport()) {
        console.error("Camera API not supported in this browser");
        setHasPermission(false);
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
          videoRef.current.onloadedmetadata = () => {
            console.log("Video metadata loaded, dimensions:", videoRef.current?.videoWidth, "x", videoRef.current?.videoHeight);
            
            // This promise must be in place for iOS Safari
            videoRef.current?.play().then(() => {
              console.log("Video playback started successfully");
              setIsActive(true);
            }).catch(err => {
              console.error("Error playing video:", err);
              // Attempt to autoplay failed. This often happens on mobile
              // Try again with user interaction if needed
            });
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
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.onloadedmetadata = () => {
                videoRef.current?.play()
                  .then(() => setIsActive(true))
                  .catch(e => console.error("Fallback video play error:", e));
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
          style={{ transform: 'scaleX(-1)' }} // Mirror for front camera if needed
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
