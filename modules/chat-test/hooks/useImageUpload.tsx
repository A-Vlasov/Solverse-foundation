
import { useState } from 'react';


interface CustomImage {
  id: string;
  url: string;
  thumbnail: string;
}

export function useImageUpload() {
  const [customImages, setCustomImages] = useState<CustomImage[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  
  
  

  return {
    customImages,
    uploadingImage,
    
  };
} 