import { useEffect, useRef, useState, useMemo } from 'react';
import { useAuth } from '../context/authContext';
import { useSocket } from '../context/socketContext';
import { getMessages } from '../services/api';
import MessageInput from './MessageInput';

const ChatWindow = ({ conversation }) => {
  const { user } = useAuth();
  const { on, off, emit, onlineUsers } = useSocket();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const markedAsReadRef = useRef(new Set());

  const convId = conversation?._id;

  const otherUser = useMemo(() => {
    if (!conversation?.participants) return null;
    return conversation.participants.find(
      (p) => String(p._id) !== String(user._id)
    );
  }, [conversation?.participants, user._id]);

  const isOnline = onlineUsers.includes(otherUser?._id);

  // load message
  useEffect(() => {
    if (!convId) return;

    markedAsReadRef.current.clear();

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const data = await getMessages(convId, user.token);
        setMessages(data.messages);

        data.messages.forEach((msg) => {
          if (msg.sender._id === user._id) {
            markedAsReadRef.current.add(msg._id);
          }
        });
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [convId, user.token, user._id]);

  useEffect(() => {
    if (!convId) return;

    emit('join_conversation', convId);

    return () => {
      emit('leave_conversation', convId);
    };
  }, [convId, emit]);

  // receive message
  useEffect(() => {
    if (!convId) return;

    const handleReceiveMessage = (message) => {
      if (String(message.convId) === String(convId)) {
        setMessages((prev) => {
          const exists = prev.some((m) => m._id === message._id);
          if (exists) return prev;
          return [...prev, message];
        });

        if (
          message.sender._id !== user._id &&
          !markedAsReadRef.current.has(message._id)
        ) {
          markedAsReadRef.current.add(message._id);
          emit('mark_read', {
            msgId: message._id,
            userId: user._id,
          });
        }
      }
    };
    on('receive_message', handleReceiveMessage);

    return () => {
      off('receive_message', handleReceiveMessage);
    };
  }, [convId, on, off, emit, user._id]);

  // message read event
  useEffect(() => {
    const handleMessageRead = ({ msgId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          String(msg._id) === String(msgId)
            ? { ...msg, read: true, readAt: new Date() }
            : msg
        )
      );
    };

    on('message_read', handleMessageRead);

    return () => {
      off('message_read', handleMessageRead);
    };
  }, [on, off]);

  // when open page make not read to read
  useEffect(() => {
    if (!convId || messages.length === 0) return;

    // find not read
    const unreadMessages = messages.filter(
      (msg) =>
        !msg.read &&
        msg.sender._id !== user._id &&
        !markedAsReadRef.current.has(msg._id)
    );

    // read
    if (unreadMessages.length > 0) {
      unreadMessages.forEach((msg) => {
        markedAsReadRef.current.add(msg._id);
        emit('mark_read', {
          msgId: msg._id,
          userId: user._id,
        });
      });
    }
  }, [convId, user._id, emit, messages.length]);

  // typing indicator
  useEffect(() => {
    if (!convId || !otherUser?._id) return;

    const handleTyping = ({ userId, convId: typingConvId }) => {
      if (
        String(typingConvId) === String(convId) &&
        String(userId) === String(otherUser._id)
      ) {
        setIsTyping(true);
      }
    };

    const handleStopTyping = ({ userId, convId: typingConvId }) => {
      if (
        String(typingConvId) === String(convId) &&
        String(userId) === String(otherUser._id)
      ) {
        setIsTyping(false);
      }
    };

    on('user_typing', handleTyping);
    on('user_stop_typing', handleStopTyping);

    return () => {
      off('user_typing', handleTyping);
      off('user_stop_typing', handleStopTyping);
      setIsTyping(false);
    };
  }, [convId, otherUser?._id, on, off]);

  // auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-400">Loading messages...</p>
      </div>
    );
  }

  if (!otherUser) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-400">Loading conversation...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* header */}
      <div className="flex items-center gap-3 border-b border-gray-200 p-4">
        <img
          src={otherUser.avatar || '/avatar-default.svg'}
          alt={otherUser.username}
          className="h-10 w-10 rounded-full"
          onError={(e) => (e.target.src = '/avatar-default.svg')}
        />
        <div>
          <h3 className="font-semibold">{otherUser.username}</h3>
          <p className="text-sm text-gray-500">
            {isTyping ? (
              <span className="text-blue-500">typing...</span>
            ) : isOnline ? (
              'Online'
            ) : (
              'Offline'
            )}
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
              const isMyMessage = msg.sender._id === user._id;

              return (
                <div
                  key={msg._id || index}
                  className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs rounded-lg px-4 py-2 ${
                      isMyMessage
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    <p className="wrap-break-word">{msg.content}</p>
                    <div className="mt-1 flex items-center justify-end gap-1 text-xs">
                      <span
                        className={
                          isMyMessage ? 'text-blue-100' : 'text-gray-500'
                        }
                      >
                        {new Date(msg.createdAt).toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {isMyMessage && (
                        <span
                          className={
                            msg.read ? 'text-blue-200' : 'text-blue-300'
                          }
                        >
                          {msg.read ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-gray-200 px-4 py-2">
                  <div className="flex gap-1">
                    <span className="animate-bounce">•</span>
                    <span className="animate-bounce [animation-delay:0.15s]">
                      •
                    </span>
                    <span className="animate-bounce [animation-delay:0.3s]">
                      •
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* input */}
      <MessageInput convId={convId} />
    </div>
  );
};

export default ChatWindow;
