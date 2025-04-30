import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Camera, Upload, X } from 'lucide-react';

interface ImageTargetInputProps {
  onChange: (value: string) => void;
  value: string;
}

export default function ImageTargetInput({ onChange, value }: ImageTargetInputProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };
  
  // Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };
  
  // Process file and create data URL
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewUrl(result);
      onChange(result); // Pass data URL to parent component
    };
    reader.readAsDataURL(file);
  };
  
  // Clear selected image
  const clearImage = () => {
    setPreviewUrl(null);
    onChange('');
  };
  
  // Open camera for mobile devices
  const openCamera = () => {
    const input = document.getElementById('camera-input') as HTMLInputElement;
    if (input) {
      input.click();
    }
  };
  
  return (
    <div className="space-y-2">
      <Label>Image Target</Label>
      
      {previewUrl ? (
        // Image preview with remove button
        <div className="relative rounded-md overflow-hidden border border-input">
          <img 
            src={previewUrl} 
            alt="Target preview" 
            className="w-full h-48 object-contain bg-black/5"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 rounded-full"
            onClick={clearImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        // Upload area
        <div
          className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center h-48 ${
            isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground text-center mb-2">
            Drag and drop an image, or click to select
          </p>
          <div className="flex gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => document.getElementById('file-input')?.click()}
              size="sm"
            >
              Select File
            </Button>
            <Button
              variant="outline"
              onClick={openCamera}
              size="sm"
            >
              <Camera className="h-4 w-4 mr-1" />
              Camera
            </Button>
          </div>
        </div>
      )}
      
      {/* Hidden file inputs */}
      <input
        id="file-input"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        id="camera-input"
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
