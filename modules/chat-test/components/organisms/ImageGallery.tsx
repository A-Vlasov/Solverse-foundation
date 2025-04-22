
import React, { useState, useRef } from 'react';
import { X, Upload, Trash2, Eye, Loader } from 'lucide-react';
import { useLocale } from '../../contexts/LocaleContext';


interface ImageItem {
  id: string;       
  url: string;      
  thumbnail: string;
  description?: string; 
  prompt?: string;    
}

interface ImageGalleryProps {
  show: boolean;
  preloadedImages: ImageItem[];
  customImages: ImageItem[];
  uploadingImage: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string) => void; 
  onDeleteCustomImage: (imageId: string) => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void; 
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  show,
  preloadedImages,
  customImages,
  uploadingImage,
  onClose,
  onSelectImage,
  onDeleteCustomImage,
  onFileUpload,
}) => {
  const [activeTab, setActiveTab] = useState<'preloaded' | 'custom'>('preloaded');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLocale(); 

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  if (!show) {
    return null;
  }

  return (
    
    
    <div className="fixed bottom-20 left-1/4 right-0 mx-auto w-3/4 max-w-2xl h-64 bg-white border border-gray-300 rounded-lg shadow-xl z-10 flex flex-col">
      {}
      <div className="p-2 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
         <div className="flex space-x-1">
            <button 
              onClick={() => setActiveTab('preloaded')}
              className={`px-3 py-1 rounded text-sm font-medium ${
                activeTab === 'preloaded' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
              }`}
             >
               {t('readyPhotos')} {}
            </button>
            <button 
              onClick={() => setActiveTab('custom')}
              className={`px-3 py-1 rounded text-sm font-medium ${
                activeTab === 'custom' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
               Кастомные {}
             </button>
         </div>
         <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
         </button>
      </div>
      {}
      <div className="flex-1 overflow-y-auto p-3">
         {activeTab === 'preloaded' && (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2">
                {preloadedImages.map((img) => (
                   <div key={img.id} className="relative group cursor-pointer" onClick={() => onSelectImage(img.thumbnail)}> 
                      <img src={img.thumbnail} alt={img.description || 'Preloaded Image'} className="w-full h-24 object-cover rounded border border-gray-200 group-hover:opacity-75 transition-opacity" />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-opacity">
                        <Eye size={24} className="text-white opacity-0 group-hover:opacity-100"/>
                      </div>
                   </div>
                ))}
                 {preloadedImages.length === 0 && <p className="text-gray-500 text-sm col-span-full">Нет готовых изображений.</p>}
            </div>
         )}
         {activeTab === 'custom' && (
             <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2">
                {customImages.map((img) => (
                    <div key={img.id} className="relative group cursor-pointer" > 
                        <img src={img.url} alt={img.description || 'Custom Image'} className="w-full h-24 object-cover rounded border border-gray-200 group-hover:opacity-75 transition-opacity" onClick={() => onSelectImage(img.url)}/>
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-opacity" onClick={() => onSelectImage(img.url)}>
                            <Eye size={24} className="text-white opacity-0 group-hover:opacity-100"/>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); onDeleteCustomImage(img.id); }} className="absolute top-1 right-1 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all z-10">
                            <Trash2 size={12}/>
                        </button>
                    </div>
                 ))}
                 {} 
                 <button 
                    onClick={handleUploadClick}
                    disabled={uploadingImage}
                    className="w-full h-24 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors disabled:opacity-50"
                 >
                     {uploadingImage ? <Loader size={24} className="animate-spin mb-1"/> : <Upload size={24} className="mb-1"/>}
                     <span className="text-xs">{uploadingImage ? 'Загрузка...' : 'Загрузить'}</span> {} 
                 </button>
                 {} 
                 <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={onFileUpload} 
                    accept="image/*"
                    className="hidden"
                 />
                 {customImages.length === 0 && !uploadingImage && <p className="text-gray-500 text-sm col-span-full">Нет загруженных изображений.</p>}
             </div>
         )}
      </div>
    </div>
  );
};

export default ImageGallery; 