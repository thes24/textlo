import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/authContext';
import { useSocket } from '../context/socketContext';

const MessageInput = ({ convId, onMessageSent }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const textareaRef = useRef(null);
  const { user } = useAuth();
  const { emit } = useSocket();

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
    }
  }, [message]);

  const handleSend = async () => {
    if (!message.trim() || sending) return;

    setSending(true);
    const messageToSend = message.trim();

    try {
      emit('send_message', {
        convId,
        content: messageToSend,
        senderId: user._id,
      });

      const tempMessage = {
        _id: Date.now().toString(),
        convId,
        sender: {
          _id: user._id,
          username: user.username,
          avatar: user.avatar,
        },
        content: messageToSend,
        createdAt: new Date().toISOString(),
      };

      onMessageSent(tempMessage);
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-200 p-4">
      <div className="flex gap-2">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={sending}
          rows={1}
          className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
          style={{ minHeight: '2.5rem', maxHeight: '8rem' }}
        />
        <button
          onClick={handleSend}
          disabled={!message.trim() || sending}
          className="h-10 shrink-0 rounded-lg bg-blue-500 px-6 text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
