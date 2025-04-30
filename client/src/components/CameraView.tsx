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
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setMediaStream(stream);
          setHasPermission(true);
          setIsActive(true);
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasPermission(false);
      }
    };

    initCamera();

    // Cleanup on unmount
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
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
      <div className="relative flex-1 bg-black">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />
        
        {/* Scanner overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 border-2 border-white/80 rounded-lg"></div>
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
