
import React from 'react';
import { Search, Menu, ExternalLink } from 'lucide-react';

import { useLocale } from '../../contexts/LocaleContext';

interface ChatHeaderProps {
  selectedUserName: string;
  userStatus: string; 
  grokChatLink?: string; 
  
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  selectedUserName,
  userStatus,
  grokChatLink,
  
}) => {
  const { t } = useLocale(); 

  return (
    <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center">
      <div className="flex items-center">
        {}
        <img src={`/foto/${selectedUserName.toLowerCase()}.jpg`} alt={selectedUserName} className="w-10 h-10 rounded-full mr-3" />
        <div>
          <h3 className="font-semibold">{selectedUserName}</h3>
          <p className="text-sm text-green-500 flex items-center">
            {}
            <span className="h-2 w-2 bg-green-500 rounded-full mr-1"></span>
            {userStatus} {}
          </p>
        </div>
      </div>
      <div className="text-gray-500 flex items-center space-x-2">
         {} 
         {} 

         {} 
         {grokChatLink && (
            <a 
                href={grokChatLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                title={`Open Grok chat for ${selectedUserName}`}
              >
                <ExternalLink size={16} className="mr-1" />
                Grok Chat
            </a>
         )}
         <button className="hover:text-gray-700">
             <Search size={20} />
         </button>
         <button className="hover:text-gray-700">
             <Menu size={20} />
         </button>
      </div>
    </div>
  );
};

export default ChatHeader; 