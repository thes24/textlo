import { useState } from 'react';
import { useAuth } from '../context/authContext';
import { useSocket } from '../context/socketContext';

const MessageInput = ({ convId, onMesageSent }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  const { emit } = useSocket();

  const handleSend = async () => {
    if (!message.trim() || sending) return;

    setSending(true);

    try {
      emit('send_message', {
        convId,
        content: message.trim(),
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
        content: message.trim(),
        createdAt: new Date().toISOString(),
      };

      onMesageSent(tempMessage);
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
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={sending}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
        />
        <button
          onClick={handleSend}
          disabled={!message.trim() || sending}
          className="rounded-lg bg-blue-500 px-6 py-2 text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
