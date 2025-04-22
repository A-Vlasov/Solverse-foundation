
import { DialogueMessage, TestResultState, Dialogue } from './types';

export const cleanMessageTags = (text: string): string => {
  return text
    .replace(/\[\s*Not\s*Bought\s*\]/gi, '')
    .trim()
    .replace(/\s+/g, ' ');
};

export const cleanContent = (text: string): string => {
  return text
    .replace(/\[\s*Not\s*Bought\s*\]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export const checkPhotoPurchaseStatus = (dialogueMessages: DialogueMessage[], photoMsgIndex: number): boolean => {
  const photoMsg = dialogueMessages[photoMsgIndex];
  if (photoMsg.bought || photoMsg.purchased) return true;
  if (photoMsg.content && photoMsg.content.includes('[Bought]')) return true;
  const priceMatch = photoMsg.content.match(/\[Price: (.*?)\]/);
  if (!priceMatch || priceMatch[1] === 'FREE') return false;
  for (let i = photoMsgIndex + 1; i < dialogueMessages.length; i++) {
    const msg = dialogueMessages[i];
    if (!msg.isOwn) {
      if (msg.content.includes('[Bought]')) return true;
      if (msg.boughtTag || msg.purchased || msg.bought) return true;
    }
  }
  return false;
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });
};

export const calculateTestDuration = (startTime: string | null | undefined, endTime: string | null | undefined): string => {
  if (!startTime) return 'Не начат';
  if (!endTime) return 'Не завершен';
  
  return '20 мин.';
};

export const debug = (sessionId: string, chats: any[], testResult: TestResultState) => {
  
  
  
  console.log('SessionId:', sessionId);
  
  console.log('Chats:', chats.length);
  
  console.log('Test Result:', testResult?.candidateName);
}; 