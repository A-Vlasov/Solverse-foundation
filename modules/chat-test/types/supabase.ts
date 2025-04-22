export interface ChatMessage {
    id?: string; 
    created_at?: string; 
    employee_id?: string;
    recipient_id?: string;
    sender_id: string; 
    content: string;
    time: string;
    isOwn: boolean;
    isRead?: boolean;
    isTyping?: boolean; 
    error?: boolean;
    errorDetails?: string;
    imageUrl?: string; 
    price?: string;    
    imageComment?: string; 
    purchased?: boolean; 
    pending?: boolean;
    bought?: boolean; 
    
    
    
} 