import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import ImageTargetInput from './ImageTargetInput';
import { Loader2, Upload } from 'lucide-react';

// Form schema
const formSchema = z.object({
  model_name: z.string().min(2, 'Model name is required'),
  image_target: z.string().min(1, 'Image target is required'),
  model_file_url: z.string().min(1, 'Model file URL is required'),
  description: z.string().min(10, 'Description should be at least 10 characters'),
});

type FormValues = z.infer<typeof formSchema>;

interface ModelUploadFormProps {
  onSubmit: (data: FormValues) => Promise<void>;
  initialData?: Partial<FormValues>;
}

export default function ModelUploadForm({ onSubmit, initialData }: ModelUploadFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form definition
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      model_name: initialData?.model_name || '',
      image_target: initialData?.image_target || '',
      model_file_url: initialData?.model_file_url || '',
      description: initialData?.description || '',
    },
  });
  
  // Form submission handler
  const handleSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      
      if (!initialData) {
        // Reset form if this is a new upload (not an edit)
        form.reset({
          model_name: '',
          image_target: '',
          model_file_url: '',
          description: '',
        });
      }
      
      toast({
        title: initialData ? 'Model updated' : 'Model uploaded',
        description: initialData 
          ? 'The model has been successfully updated.' 
          : 'Your model has been successfully uploaded.',
      });
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: 'Submission failed',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle actual file upload by converting to data URL
  const handleModelFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Read file as data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        form.setValue('model_file_url', dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Model name */}
        <FormField
          control={form.control}
          name="model_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Model Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter model name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Image target */}
        <FormField
          control={form.control}
          name="image_target"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <ImageTargetInput 
                  value={field.value} 
                  onChange={field.onChange} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* 3D model file */}
        <FormField
          control={form.control}
          name="model_file_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>3D Model File</FormLabel>
              {field.value ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-2 border rounded-md text-sm bg-muted/50 overflow-hidden">
                    {field.value.length > 40 
                      ? field.value.substring(0, 30) + '...' + field.value.substring(field.value.length - 10) 
                      : field.value}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.setValue('model_file_url', '')}
                  >
                    Clear
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept=".glb,.gltf,.obj,.fbx,.usdz"
                    onChange={handleModelFileSelect}
                    className="hidden"
                    id="model-file-input"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-20 flex-col gap-1"
                    onClick={() => document.getElementById('model-file-input')?.click()}
                  >
                    <Upload className="h-5 w-5" />
                    <span>Select 3D Model File</span>
                    <span className="text-xs text-muted-foreground">
                      (.glb, .gltf, .obj, .fbx, .usdz)
                    </span>
                  </Button>
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter model description" 
                  rows={4}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Submit button */}
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
              {initialData ? 'Updating...' : 'Uploading...'}
            </span>
          ) : (
            initialData ? 'Update Model' : 'Upload Model'
          )}
        </Button>
      </form>
    </Form>
  );
}
