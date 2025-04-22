'use client';

import React, { useState, useRef, useCallback } from 'react';
import { X, Info, Brain, Loader } from 'lucide-react'; 
import ChatHeader from '../molecules/ChatHeader';
import UserList from './UserList';
import MessageArea from './MessageArea';
import ChatInput from './ChatInput';
import ImageGallery from './ImageGallery';
import PriceModal from './PriceModal';
import ResultsModal from './ResultsModal'; 
import PromptModal from './PromptModal'; 
import { useLocale } from '../../lib/LocaleContext';


import { useChatSession } from '../../hooks/useChatSession';
import { useChatMessages, Message as ChatMessage } from '../../hooks/useChatMessages';
import { useChatTimer } from '../../hooks/useChatTimer';
import { useChatUsers } from '../../hooks/useChatUsers';
import { useImageUpload } from '../../hooks/useImageUpload';

interface ChatInterfaceProps {
  sessionId: string;
}


const PRELOADED_IMAGES = [
    { id: 'p1', url: '/foto/1.jpg', thumbnail: '/foto/1.jpg', description: 'Alpha' },
    { id: 'p2', url: '/foto/2.jpg', thumbnail: '/foto/2.jpg', description: 'Beta' },
];


interface AnalysisResult {
    overallScore: number;
    positivePoints: string[];
    negativePoints: string[];
    suggestions: string[];
}

export default function ChatInterface({ sessionId }: ChatInterfaceProps) {
  const { t } = useLocale();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false); 
  const [showPromptModal, setShowPromptModal] = useState(false); 
  const [imageToPrice, setImageToPrice] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ url: string; price: string; comment: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  
  const { session, isLoading: sessionLoading, isError: sessionError } = useChatSession(sessionId);
  const { timeRemaining, formattedTime, isExpired } = useChatTimer(sessionId);
  const { users, statuses, isLoadingUsers, isErrorUsers, isLoadingStatuses, isErrorStatuses } = useChatUsers(sessionId);
  const { messages: allMessages, isLoading: messagesLoading, isError: messagesError, sendMessage } = useChatMessages(sessionId);
  const { customImages, isLoading: imagesLoading, isError: imagesError, uploading: uploadingImage, uploadError, triggerUpload, deleteImage } = useImageUpload(sessionId);
  

  
  React.useEffect(() => {
      if (!selectedUserId && users && users.length > 0) {
          const firstUser = users.find(u => !u.isBot) || users[0];
          if (firstUser) setSelectedUserId(firstUser.id);
      }
  }, [users, selectedUserId]);

  
  if (sessionLoading || isLoadingUsers || isLoadingStatuses) {
      return <div className="flex items-center justify-center h-full w-full text-white">Загрузка сессии...</div>;
  }
  if (sessionError || isErrorUsers || isErrorStatuses || imagesError) {
      console.error("Session Error:", sessionError);
      console.error("Users Error:", isErrorUsers);
      console.error("Statuses Error:", isErrorStatuses);
      console.error("Images Error:", imagesError);
      return <div className="flex items-center justify-center h-full w-full text-red-500">Ошибка загрузки данных чата.</div>;
  }
  if (!session) {
      return <div className="flex items-center justify-center h-full w-full text-yellow-500">Сессия не найдена.</div>;
  }

  
  const handleSelectUser = (userId: string) => {
      setSelectedUserId(userId);
      setShowImageGallery(false);
      setShowPriceModal(false);
      setShowResultsModal(false);
      setShowPromptModal(false);
      setSelectedImage(null);
      setImageToPrice(null);
  };

  const messages = allMessages; 

  const onRetryMessage = useCallback((msg: ChatMessage) => {
      console.warn('Retry logic not implemented yet for message:', msg);
  }, []);

  const [messageInput, setMessageInput] = useState('');

  
  const handleSendMessageWrapper = useCallback((e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if ((!messageInput.trim() && !selectedImage) || !selectedUserId || isExpired) return;
      const contentToSend = messageInput.trim();
      sendMessage(contentToSend, selectedImage?.url, selectedImage?.price, selectedImage?.comment)
          .then(() => {
              setMessageInput('');
              setSelectedImage(null);
          })
          .catch((err) => {
              console.error("Failed to send message:", err);
          });
  }, [messageInput, selectedImage, selectedUserId, isExpired, sendMessage]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSendMessageWrapper();
      }
  }, [handleSendMessageWrapper]);

  const handleToggleImageGallery = useCallback(() => {
      setShowImageGallery(prev => !prev);
      if (showPriceModal) setShowPriceModal(false);
  }, [showPriceModal]);

  
  const handleSelectImageFromGallery = useCallback((imageUrl: string) => {
      setImageToPrice(imageUrl);
      setShowPriceModal(true);
      setShowImageGallery(false);
  }, []);
  const handleConfirmPrice = useCallback((price: string, comment: string) => {
      if (imageToPrice) {
          setSelectedImage({ url: imageToPrice, price, comment });
          setImageToPrice(null);
          setShowPriceModal(false);
      } else {
          console.error("handleConfirmPrice called without imageToPrice being set.");
          setShowPriceModal(false);
      }
  }, [imageToPrice]);
  const handleClosePriceModal = useCallback(() => {
      setImageToPrice(null);
      setShowPriceModal(false);
  }, []);

  
  const handleUploadClick = useCallback(() => {
      fileInputRef.current?.click();
  }, []);
  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
       const file = event.target.files?.[0];
       if (file) {
           const uploadedImage = await triggerUpload(file);
           if (uploadedImage) console.log('Uploaded image:', uploadedImage);
       }
       if (fileInputRef.current) fileInputRef.current.value = '';
   }, [triggerUpload]);
  const handleDeleteCustomImage = useCallback(async (imageId: string) => {
       if (selectedImage?.url.includes(imageId)) setSelectedImage(null);
      try { await deleteImage(imageId); } catch (error) { console.error("Failed to delete image:", error); }
   }, [deleteImage, selectedImage]);

   
  const handleOpenPromptModal = useCallback(() => {
      if (!selectedUserId) return; 
      setShowPromptModal(true);
      
      setShowImageGallery(false);
      setShowPriceModal(false);
  }, [selectedUserId]);

  const handleClosePromptModal = useCallback(() => {
      setShowPromptModal(false);
  }, []);
  

  
  const handleTriggerAnalysis = useCallback(async () => {
    if (!sessionId || isAnalyzing) return;
    setIsAnalyzing(true);
    setAnalysisResults(null);
    setAnalysisError(null);
    setShowResultsModal(true); 

    try {
        const response = await fetch('/api/chat-test/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId }),
        });

        if (!response.ok) {
            
            if (response.status !== 202) {
                let errorMsg = `Analysis trigger failed (${response.status})`;
                try { errorMsg = (await response.json()).message || errorMsg; } catch (e) {  }
                throw new Error(errorMsg);
            }
        }

        
        
        console.log('Analysis triggered for session:', sessionId);
        
        await new Promise(resolve => setTimeout(resolve, 3000)); 
        
        setAnalysisResults({
            overallScore: 75,
            positivePoints: ["Good engagement", "Used varied language"],
            negativePoints: ["Missed one keyword", "Slightly slow response time"],
            suggestions: ["Try using emojis more often", "Review keyword list"]
        });

    } catch (err: any) {
        console.error("Error triggering/getting analysis:", err);
        setAnalysisError(err.message || "Failed to get analysis results.");
    } finally {
        setIsAnalyzing(false);
        
    }
  }, [sessionId, isAnalyzing]);

  const handleCloseResultsModal = useCallback(() => {
      setShowResultsModal(false);
      setAnalysisResults(null);
      setAnalysisError(null);
  }, []);
  

  const isDisabled = isExpired || messagesLoading || uploadingImage || isAnalyzing; 
  

  const selectedUserDetails = users.find(u => u.id === selectedUserId);
  
  
  const selectedUserPrompt = selectedUserDetails?.isBot ? `System prompt for ${selectedUserDetails.name}...` : undefined;

  return (
    <>
    <div className="flex flex-col h-screen bg-[#1e1e1e] text-gray-100 relative">
      {}
      <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/webp, image/gif"
          style={{ display: 'none' }}
      />

      <ChatHeader
        timeRemaining={timeRemaining}
        formattedTime={formattedTime}
      />
      <div className="flex flex-1 overflow-hidden">
        <UserList
          users={users}           
          
          userStatuses={statuses} 
          selectedUserId={selectedUserId}
          onSelectUser={handleSelectUser}
          
        />
        <div className="flex-1 flex flex-col relative">
          {selectedUserDetails ? (
            <>
              {}
              <div className="p-4 border-b border-[#3d3d3d] flex items-center justify-between bg-[#2d2d2d]">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                    {}
                    {selectedUserDetails.name[0]}
                  </div>
                  <div>
                    <h2 className="font-semibold">{selectedUserDetails.name}</h2>
                    {}
                    {selectedUserId && statuses[selectedUserId]?.isTyping && (
                       <span className="text-xs text-pink-400 italic">{t('typing')}</span>
                    )}
                  </div>
                </div>
                {}
                {selectedUserDetails.isBot && selectedUserPrompt && (
                   <button
                       onClick={handleOpenPromptModal}
                       className="p-2 text-gray-400 hover:text-pink-500 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                       title="View System Prompt"
                       disabled={isDisabled}
                   >
                       <Info size={18} />
                   </button>
                )}
              </div>
              <MessageArea
                messages={messages} 
                isLoading={messagesLoading}
                isError={messagesError}
                onRetryMessage={onRetryMessage}
              />
              {}
              {selectedImage && (
                   <div className="p-2 border-t border-[#3d3d3d] bg-[#2d2d2d] flex items-center gap-3">
                       <div className="relative inline-block">
                           <img src={selectedImage.url} alt="Selected preview" className="h-16 max-w-[100px] object-contain bg-black rounded border border-[#3d3d3d]" />
                           <button onClick={() => setSelectedImage(null)} className="absolute -top-1 -right-1 bg-red-600 hover:bg-red-700 rounded-full p-0.5 text-white shadow" aria-label="Remove selected image" disabled={isDisabled}>
                               <X size={12} />
                           </button>
                       </div>
                       <div className="flex-1 flex flex-col text-xs">
                           <span className="bg-pink-500 text-white px-1.5 py-0.5 rounded-full font-medium text-center w-fit mb-1">
                               {selectedImage.price || t('free')}
                           </span>
                            {selectedImage.comment && (
                               <span className="text-gray-300 italic line-clamp-2">{selectedImage.comment}</span>
                           )}
                       </div>
                   </div>
               )}
              <ChatInput
                message={messageInput}
                setMessage={setMessageInput}
                handleSendMessage={handleSendMessageWrapper}
                handleKeyPress={handleKeyPress}
                toggleImageGallery={handleToggleImageGallery}
                openPromptModal={handleOpenPromptModal}
                isDisabled={isDisabled} 
                hasSelectedImage={!!selectedImage}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Выберите пользователя для начала чата.
            </div>
          )}
          {}
          <ImageGallery
              show={showImageGallery}
              preloadedImages={PRELOADED_IMAGES}
              customImages={customImages || []}
              onSelectImage={handleSelectImageFromGallery} 
              onUploadClick={handleUploadClick}
              onDeleteCustomImage={handleDeleteCustomImage}
              uploadingImage={uploadingImage}
              isDisabled={isDisabled}
          />
        </div>
      </div>

       {}
       {session.status === 'active' && !isExpired && (
            <button
                onClick={handleTriggerAnalysis}
                disabled={isAnalyzing}
                className={`absolute bottom-20 right-4 bg-gradient-to-r from-green-500 to-teal-500 hover:opacity-90 text-white font-semibold py-2 px-4 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-wait flex items-center space-x-2`}
            >
                {isAnalyzing ? <Loader className="animate-spin w-5 h-5" /> : <Brain size={18} />}
                <span>{isAnalyzing ? 'Анализ...' : 'Завершить и анализировать'}</span>
            </button>
        )}

    </div>

    {}
    <PriceModal
        show={showPriceModal}
        initialPrice={t('free')} 
        initialComment={messageInput} 
        onClose={handleClosePriceModal}
        onConfirm={handleConfirmPrice}
        isDisabled={isDisabled} 
        timeRemaining={timeRemaining}
    />
    <ResultsModal show={showResultsModal} onClose={handleCloseResultsModal} isLoading={isAnalyzing} error={analysisError} results={analysisResults} />
    <PromptModal show={showPromptModal} onClose={handleClosePromptModal} userName={selectedUserDetails?.name || ''} promptText={selectedUserPrompt} />
    </>
  );
} 