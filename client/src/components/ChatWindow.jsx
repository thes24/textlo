import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/authContext';
import { useSocket } from '../context/socketContext';
import { getMessages } from '../services/api';
import MessageInput from './MessageInput';

const ChatWindow = ({ conversation }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const messageEndRef = useRef(null);
  const { user } = useAuth();
  const { on, off, onlineUsers } = useSocket();

  const otherUser = conversation.participants.find((p) => p._id !== user._id);
  const isOnline = onlineUsers.includes(otherUser._id);

  // load message
  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const data = await getMessages(conversation._id, user.token);
        setMessages(data.messages);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [conversation._id, user.token]);

  // receive message
  useEffect(() => {
    const handleReceiveMessage = async (message) => {
      if (message.convId === conversation._id) {
        setMessages((prev) => [...prev, message]);
      }
    };

    on('receive_message', handleReceiveMessage);

    return () => {
      off('receive_message', handleReceiveMessage);
    };
  }, [conversation._id, on, off]);

  // auto scroll
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (newMessage) => {
    setMessages((prev) => [...prev, newMessage]);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-400">Loading Message...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* header */}
      <div className="flex items-center gap-3 border-b border-gray-200 p-4">
        <img
          src={otherUser.avatar}
          alt={otherUser.username}
          className="h-10 w-10 rounded-full"
        />
        <div>
          <h3 className="font-semibold">{otherUser.username}</h3>
          <p className="text-sm text-gray-500">
            {isOnline ? 'Online' : 'Offline'}
          </p>
        </div>
      </div>

      {/* messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="text-center text-gray-400">
            No messages yet. Start the conversation!
          </p>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => {
              const isMyMessage = msg.sender._id == user._id;

              return (
                <div
                  key={msg._id || index}
                  className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs rounded-lg px-4 py-2 ${isMyMessage ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
                  >
                    <p className="wrap-break-word">{msg.content}</p>
                    <p
                      className={`mt-1 text-xs ${isMyMessage ? 'text-blue-100' : 'text-gray-500'}`}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messageEndRef} />
          </div>
        )}
      </div>

      {/* input */}
      <MessageInput
        convId={conversation._id}
        onMessageSent={handleSendMessage}
      />
    </div>
  );
};

export default ChatWindow;
