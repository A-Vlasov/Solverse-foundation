import OpenAI from 'openai';

// Grok API service
interface GrokResponse {
  conversation_id: string;
  parent_response_id: string;
  response: string;
  chat_link?: string;
  error?: string;
}

// Use environment variables for API URLs
const API_BASE_URL = 'https://grok.ru.tuna.am/api';

/**
 * Sends a message to Grok API to start a new conversation
 */
export const startNewGrokConversation = async (message: string): Promise<GrokResponse> => {
  try {
    console.log('Starting new Grok conversation with message:', message);
    
    const response = await fetch(`${API_BASE_URL}/chat/new`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server responded with error:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
    }

    const data = await response.json();
    console.log('Received response from Grok API:', data);
    return data;
  } catch (error) {
    console.error('Error starting new Grok conversation:', error);
    
    return {
      conversation_id: '',
      parent_response_id: '',
      response: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Sends a message to an existing Grok conversation
 */
export const continueGrokConversation = async (
  message: string,
  conversation_id: string,
  parent_response_id: string
): Promise<GrokResponse> => {
  try {
    console.log('Continuing Grok conversation:', {
      message,
      conversation_id,
      parent_response_id
    });
    
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        conversation_id,
        parent_response_id
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server responded with error:', response.status, errorText);
      
      // If chat not found, start a new conversation
      if (response.status === 404) {
        console.log('Chat not found, creating new conversation...');
        return startNewGrokConversation(message);
      }
      
      throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
    }

    const data = await response.json();
    console.log('Received response from Grok API:', data);
    return data;
  } catch (error) {
    console.error('Error continuing Grok conversation:', error);
    
    return {
      conversation_id,
      parent_response_id,
      response: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Generates a response using Grok
 */
export const generateGrokResponse = async (
  messages: { role: 'user' | 'assistant' | 'system', content: string }[],
  conversationDetails?: { conversationId: string; parentResponseId: string }
): Promise<GrokResponse> => {
  const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user');
  const systemMessage = messages.find(msg => msg.role === 'system');
  
  if (!lastUserMessage) {
    return {
      conversation_id: '',
      parent_response_id: '',
      response: '',
      error: 'No user message found'
    };
  }

  let messageToSend = lastUserMessage.content;
  
  if (systemMessage && !conversationDetails) {
    messageToSend = `${systemMessage.content}\n\nСообщение пользователя: ${messageToSend}`;
  }

  if (conversationDetails?.conversationId && conversationDetails?.parentResponseId) {
    return continueGrokConversation(
      messageToSend,
      conversationDetails.conversationId,
      conversationDetails.parentResponseId
    );
  }
  
  return startNewGrokConversation(messageToSend);
};