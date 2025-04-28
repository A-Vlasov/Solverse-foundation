import { FC } from 'react';

interface ChatInputProps {
  inputMessage: string;
  setInputMessage: (v: string) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  sendMessage: () => void;
  loading: boolean;
}

export const ChatInput: FC<ChatInputProps> = ({ inputMessage, setInputMessage, handleKeyDown, sendMessage, loading }) => (
  <div className="p-4 border-t border-gray-200 bg-white">
    <div className="flex">
      <textarea
        className="flex-grow border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        placeholder="Введите сообщение..."
        rows={1}
        value={inputMessage}
        onChange={e => setInputMessage(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button
        className={`px-4 py-2 rounded-r-lg ${
          loading || !inputMessage.trim()
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600'
        } text-white transition`}
        onClick={sendMessage}
        disabled={loading || !inputMessage.trim()}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>
    </div>
  </div>
); 