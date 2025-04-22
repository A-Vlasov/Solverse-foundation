import React, { useState, ChangeEvent, KeyboardEvent, FormEvent } from 'react';
import { Image, Send, Trash2 } from 'lucide-react';
import { useLocale } from '../../contexts/LocaleContext';

interface ChatInputProps {
  message: string;
  setMessage: (value: string) => void;
  handleSendMessage: (e: FormEvent) => void;
  handleKeyPress: (e: KeyboardEvent<HTMLInputElement>) => void;
  toggleImageGallery: () => void;
  selectedImage: string | null;
  selectedPrice: string;
  handleRemoveImage: () => void;
  imageComment: string;
  setImageComment: (value: string) => void;
  isSessionComplete: boolean;
  retryingMessage: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  message,
  setMessage,
  handleSendMessage,
  handleKeyPress,
  toggleImageGallery,
  selectedImage,
  selectedPrice,
  handleRemoveImage,
  imageComment,
  setImageComment,
  isSessionComplete,
  retryingMessage,
}) => {
  const { t, locale } = useLocale();

  return (
    <div className="p-4 border-t border-gray-200 bg-white">
      {}
      {selectedImage && (
        <div className="mb-2 p-2 border border-gray-300 rounded-lg flex items-start bg-gray-50">
          <img src={selectedImage} alt="Selected preview" className="w-16 h-16 rounded object-cover mr-3"/>
          <div className="flex-1">
            <p className="text-sm font-semibold">{t('photo')}: {selectedPrice}</p>
            <input
              type="text"
              value={imageComment}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setImageComment(e.target.value)}
              placeholder={t('addPhotoComment')}
              className="w-full text-sm p-1 border border-gray-300 rounded mt-1"
              disabled={isSessionComplete}
            />
          </div>
          <button onClick={handleRemoveImage} className="ml-2 text-red-500 hover:text-red-700">
            <Trash2 size={18}/>
          </button>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
        <button type="button" onClick={toggleImageGallery} className="text-gray-500 hover:text-gray-700" disabled={isSessionComplete}>
          <Image size={24} />
        </button>
        <input
          type="text"
          value={message}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={isSessionComplete ? t('chat.timeExpired') : t('enterMessage')}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          disabled={isSessionComplete || !!selectedImage}
        />
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSessionComplete || (!message.trim() && !selectedImage) || retryingMessage}
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;
