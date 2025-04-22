
import React, { useState, useEffect } from 'react';
import { X, Info } from 'lucide-react';
import { useLocale } from '../../lib/LocaleContext';

interface PriceModalProps {
  show: boolean;
  imageUrl: string | null;
  currentPrice: string; 
  comment: string;
  setPrice: (price: string) => void;
  setComment: (comment: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const PriceModal: React.FC<PriceModalProps> = ({
  show,
  imageUrl,
  currentPrice,
  comment,
  setPrice,
  setComment,
  onConfirm,
  onCancel,
}) => {
  const { t } = useLocale(); 

  const priceOptions = ['бесплатно', '$5', '$10', '$15', '$20', '$50'];

  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20 p-4">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
        <h4 className="text-lg font-semibold mb-4 text-gray-800">{t('selectPhotoPrice')}</h4>
        
        {}
        {imageUrl && 
          <img src={imageUrl} alt="Selected" className="w-full max-h-48 object-contain rounded mb-4"/>
        }
        
        {}
        <input 
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('addPhotoComment')}
            className="w-full p-2 border border-gray-300 rounded mb-4 text-sm"
        />
        
        {}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {priceOptions.map((price) => {
            const displayPrice = price === 'бесплатно' ? t('free') : price;
            const isSelected = currentPrice === displayPrice;
            return (
              <button
                key={price}
                onClick={() => setPrice(displayPrice)}
                className={`p-2 border rounded text-sm font-medium transition-colors ${
                  isSelected
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {displayPrice}
              </button>
            );
          })}
        </div>
        
        {}
        <div className="flex justify-end space-x-2">
          <button onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 text-sm">
            {t('cancel')}
          </button>
          <button onClick={onConfirm} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">
            {t('confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PriceModal; 