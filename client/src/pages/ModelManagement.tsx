import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getAllModels, deleteModel, updateModel } from '@/lib/models';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import ModelUploadForm from '@/components/ModelUploadForm';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, Edit, Trash2, Loader2 } from 'lucide-react';

export default function ModelManagement() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [editingModel, setEditingModel] = useState<any | null>(null);
  const [modelToDelete, setModelToDelete] = useState<any | null>(null);
  
  // Fetch all models
  const { data: models, isLoading, error } = useQuery({
    queryKey: ['/api/models'],
  });
  
  // Update model mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) => updateModel(data.id, data.modelData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/models'] });
      setEditingModel(null);
    },
  });
  
  // Delete model mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteModel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/models'] });
      setModelToDelete(null);
      toast({
        title: 'Model deleted',
        description: 'The model has been successfully deleted.',
      });
    },
  });
  
  // Handle back button
  const handleBack = () => {
    setLocation('/');
  };
  
  // Handle edit model
  const handleEditModel = (model: any) => {
    setEditingModel(model);
  };
  
  // Handle update form submission
  const handleUpdateSubmit = async (data: any) => {
    if (!editingModel) return;
    
    await updateMutation.mutateAsync({
      id: editingModel.id,
      modelData: data,
    });
  };
  
  // Handle delete confirmation
  const confirmDelete = async () => {
    if (!modelToDelete) return;
    
    try {
      await deleteMutation.mutateAsync(modelToDelete.id);
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Delete failed',
        description: 'Failed to delete the model. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <div className="text-destructive mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2">Failed to load models</h2>
        <p className="text-muted-foreground mb-6">
          We couldn't load your models. Please try again later.
        </p>
        <Button onClick={handleBack}>Return to Home</Button>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="w-full p-4 flex items-center border-b">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleBack}
          className="mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">Manage Models</h1>
      </header>
      
      {/* Main content */}
      <main className="flex-1 p-4">
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-1">Your 3D Models</h2>
          <p className="text-sm text-muted-foreground">
            View, edit, or delete your uploaded 3D models.
          </p>
        </div>
        
        {models && models.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {models.map((model: any) => (
              <Card key={model.id} className="overflow-hidden">
                <div className="bg-muted h-40 flex items-center justify-center">
                  {model.image_target ? (
                    <img 
                      src={model.image_target} 
                      alt={model.model_name} 
                      className="h-full w-full object-contain" 
                    />
                  ) : (
                    <div className="text-muted-foreground">No preview</div>
                  )}
                </div>
                <CardHeader className="pb-2">
                  <CardTitle>{model.model_name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {model.description}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="pt-2 flex justify-between">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditModel(model)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => setModelToDelete(model)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center p-10 bg-muted rounded-lg">
            <p className="text-muted-foreground mb-4">
              You haven't uploaded any models yet.
            </p>
            <Button onClick={() => setLocation('/dev/upload')}>
              Upload Your First Model
            </Button>
          </div>
        )}
      </main>
      
      {/* Edit model dialog */}
      <Dialog open={!!editingModel} onOpenChange={(open) => !open && setEditingModel(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Model</DialogTitle>
            <DialogDescription>
              Update the details for this 3D model.
            </DialogDescription>
          </DialogHeader>
          
          {editingModel && (
            <ModelUploadForm 
              onSubmit={handleUpdateSubmit}
              initialData={{
                model_name: editingModel.model_name,
                image_target: editingModel.image_target,
                model_file_url: editingModel.model_file_url,
                description: editingModel.description,
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={!!modelToDelete} onOpenChange={(open) => !open && setModelToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the model "{modelToDelete?.model_name}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <span className="flex items-center">
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  Deleting...
                </span>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
