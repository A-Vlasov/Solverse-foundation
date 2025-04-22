import { useState, useEffect, useCallback, useRef } from 'react';


interface CustomImage {
  id: string;
  url: string;      
  thumbnail: string;
  description?: string;
  prompt?: string;
  file?: File;      
  isUploading?: boolean;
  uploadError?: string;
}

interface PreloadedImage {
    id: string;
    url: string;
    thumbnail: string;
    description?: string;
}

interface UseImageUploadReturn {
  
  showImageGallery: boolean;
  toggleImageGallery: () => void;
  showPriceModal: boolean;
  
  preloadedImages: PreloadedImage[]; 
  
  customImages: CustomImage[];
  uploadingImageId: string | null; 
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleDeleteCustomImage: (imageId: string) => Promise<void>;
  triggerUploadInput: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  
  tempSelectedImageUrl: string | null;
  selectedImageComment: string;
  setSelectedImageComment: React.Dispatch<React.SetStateAction<string>>;
  selectedPrice: string; 
  setSelectedPrice: React.Dispatch<React.SetStateAction<string>>;
  handleSelectImageFromGallery: (imageUrl: string, isCustom: boolean) => void;
  handlePriceModalConfirm: () => { imageUrl: string | null; price: string; comment: string } | null;
  handlePriceModalCancel: () => void;
  
  selectedImagePreview: string | null;
  handleRemoveImagePreview: () => void;
}


const getUserId = (): string | null => {
  if (typeof window !== 'undefined') {
    const candidateData = JSON.parse(sessionStorage.getItem('candidateData') || '{}');
    return candidateData.employee_id || candidateData.userId || null;
  }
  return null;
};


const DUMMY_PRELOADED_IMAGES: PreloadedImage[] = [
    
    
];

const LOCAL_STORAGE_KEY = 'chatTestCustomImages';
const DEFAULT_PRICE = 'FREE'; 

export const useImageUpload = (sessionId: string | null): UseImageUploadReturn => {
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [preloadedImages, setPreloadedImages] = useState<PreloadedImage[]>(DUMMY_PRELOADED_IMAGES);
  const [customImages, setCustomImages] = useState<CustomImage[]>([]);
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);
  const [tempSelectedImageUrl, setTempSelectedImageUrl] = useState<string | null>(null);
  const [selectedImageComment, setSelectedImageComment] = useState<string>('');
  const [selectedPrice, setSelectedPrice] = useState<string>(DEFAULT_PRICE);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        
        const parsed = (JSON.parse(saved) as CustomImage[]).filter(img => img.id && img.url && img.thumbnail);
        setCustomImages(parsed);
      } catch (e) {
        console.error("Failed to load custom images from localStorage", e);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    }
    
  }, []);

  
  useEffect(() => {
    const imagesToSave = customImages.map(({ file, ...rest }) => rest); 
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(imagesToSave));
  }, [customImages]);

  
  const toggleImageGallery = useCallback(() => {
    setShowImageGallery(prev => !prev);
  }, []);

  
  const triggerUploadInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      const tempId = `custom_${Date.now()}`;

      reader.onloadend = () => {
        const newImage: CustomImage = {
          id: tempId,
          url: reader.result as string, 
          thumbnail: reader.result as string,
          description: file.name,
          file: file, 
          isUploading: false,
        };
        setCustomImages(prev => [...prev, newImage]);
        
        
      };
      reader.readAsDataURL(file);
      event.target.value = ''; 
    }
  }, []);

  
  const uploadCustomImage = useCallback(async (imageToUpload: CustomImage): Promise<string | null> => {
    const employeeId = getUserId();
    if (!sessionId || !employeeId || !imageToUpload.file) {
      console.error('Cannot upload image: Missing sessionId, employeeId, or file.');
      setCustomImages(prev => prev.map(img => 
        img.id === imageToUpload.id ? { ...img, isUploading: false, uploadError: 'Missing data' } : img
      ));
      return null;
    }

    setUploadingImageId(imageToUpload.id);
    setCustomImages(prev => prev.map(img => 
      img.id === imageToUpload.id ? { ...img, isUploading: true, uploadError: undefined } : img
    ));

    try {
      const formData = new FormData();
      formData.append('file', imageToUpload.file);
      
      
      

      console.log(`Uploading image ${imageToUpload.id} for session ${sessionId}...`);
      
      const response = await fetch(`/api/chat-test/images`, { 
        method: 'POST',
        headers: {
          
          'X-Session-Id': sessionId,
          'X-Employee-Id': employeeId,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Image upload failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      const serverUrl = result.imageUrl; 

      console.log(`Image ${imageToUpload.id} uploaded successfully: ${serverUrl}`);

      
      setCustomImages(prev => prev.map(img => 
        img.id === imageToUpload.id 
          ? { ...img, url: serverUrl, thumbnail: serverUrl, file: undefined, isUploading: false } 
          : img
      ));
      return serverUrl;
    } catch (error) {
      console.error(`Error uploading image ${imageToUpload.id}:`, error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown upload error';
      setCustomImages(prev => prev.map(img => 
        img.id === imageToUpload.id ? { ...img, isUploading: false, uploadError: errorMsg } : img
      ));
      return null;
    } finally {
      setUploadingImageId(null);
    }
  }, [sessionId]);

  
  const handleDeleteCustomImage = useCallback(async (imageId: string) => {
    
    const imageToDelete = customImages.find(img => img.id === imageId);
    setCustomImages(prev => prev.filter(img => img.id !== imageId));

    try {
      
      console.log(`TODO: Call API to delete image with ID: ${imageId} (URL: ${imageToDelete?.url})`);
      
      
    } catch (error) {
      console.error(`Failed to delete image ${imageId} on server:`, error);
      
      if (imageToDelete) {
          setCustomImages(prev => [...prev, imageToDelete]); 
      }
      
    }
  }, [customImages]);

  
  const handleSelectImageFromGallery = useCallback((imageUrl: string, isCustom: boolean) => {
    console.log('Selected image from gallery:', imageUrl);
    setTempSelectedImageUrl(imageUrl);
    setSelectedImageComment(''); 
    setSelectedPrice(DEFAULT_PRICE); 
    setShowPriceModal(true); 
    setShowImageGallery(false); 
  }, []);

  const handlePriceModalConfirm = useCallback(() => {
    if (!tempSelectedImageUrl) return null;
    
    const selectedImage = customImages.find(img => img.url === tempSelectedImageUrl) 
                         || preloadedImages.find(img => img.thumbnail === tempSelectedImageUrl); 
    
    if (!selectedImage) {
        console.error("Could not find selected image data for URL:", tempSelectedImageUrl);
        setShowPriceModal(false);
        setTempSelectedImageUrl(null);
        return null;
    }
    
    
    const isCustomImage = (img: CustomImage | PreloadedImage): img is CustomImage => 'file' in img;
    
    if (isCustomImage(selectedImage) && selectedImage.file && !selectedImage.url.startsWith('http')) { 
        console.log("Custom image needs upload before confirming selection.");
        uploadCustomImage(selectedImage).then(serverUrl => {
            if (serverUrl) {
                
                
                
                 console.log("Upload successful, ready to send message with URL:", serverUrl);
                 
                 setSelectedImagePreview(serverUrl); 
                 
            }
        });
        setShowPriceModal(false);
        setTempSelectedImageUrl(null);
        return null; 
    } else {
         
         console.log("Image ready, confirming selection:", tempSelectedImageUrl);
         
         setSelectedImagePreview(selectedImage.thumbnail); 
         
         setShowPriceModal(false);
         setTempSelectedImageUrl(null);
         
         return {
           imageUrl: selectedImage.url, 
           price: selectedPrice,
           comment: selectedImageComment,
         };
    }
    
  }, [tempSelectedImageUrl, selectedPrice, selectedImageComment, customImages, preloadedImages, uploadCustomImage]);

  const handlePriceModalCancel = useCallback(() => {
    setShowPriceModal(false);
    setTempSelectedImageUrl(null);
    
  }, []);
  
  
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const handleRemoveImagePreview = useCallback(() => {
      setSelectedImagePreview(null);
      setSelectedPrice(DEFAULT_PRICE);
      setSelectedImageComment('');
  }, []);


  
  return {
    showImageGallery,
    toggleImageGallery,
    showPriceModal,
    preloadedImages,
    customImages,
    uploadingImageId,
    handleFileChange,
    handleDeleteCustomImage,
    triggerUploadInput,
    fileInputRef,
    tempSelectedImageUrl, 
    selectedImageComment,
    setSelectedImageComment,
    selectedPrice,
    setSelectedPrice,
    handleSelectImageFromGallery,
    handlePriceModalConfirm,
    handlePriceModalCancel,
    
    selectedImagePreview, 
    handleRemoveImagePreview, 
  };
}; 