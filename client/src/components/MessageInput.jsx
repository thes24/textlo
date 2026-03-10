import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/authContext';
import { useSocket } from '../context/socketContext';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

const MessageInput = ({ convId }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { user } = useAuth();
  const { emit } = useSocket();

  // auto-expanding textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
    }
  }, [message]);

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      emit('typing', {
        convId,
        userId: user._id,
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      emit('stop_typing', {
        convId,
        userId: user._id,
      });
    }, 3000);
  };

  const handleChange = (e) => {
    setMessage(e.target.value);
    handleTyping();
  };

  const handleSend = async () => {
    if (!message.trim() || sending) return;

    setSending(true);
    const messageToSend = message.trim();

    // stop typing
    setIsTyping(false);
    emit('stop_typing', {
      convId,
      userId: user._id,
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    try {
      emit('send_message', {
        convId,
        content: messageToSend,
        senderId: user._id,
      });

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

  // cleanup
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTyping) {
        emit('stop_typing', {
          convId,
          userId: user._id,
        });
      }
    };
  }, [convId, user._id, emit, isTyping]);

  return (
    <div className="border-t border-gray-200 p-4">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={sending}
          rows={1}
          className="flex-1 resize-none overflow-y-auto rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
          style={{ minHeight: '2.5rem', maxHeight: '8rem' }}
        />
        <button
          onClick={handleSend}
          disabled={!message.trim() || sending}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500 text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300"
          aria-label="Send message"
        >
          <PaperAirplaneIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
