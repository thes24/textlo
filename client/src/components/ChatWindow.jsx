// client/src/components/ChatWindow.jsx
import { useEffect, useRef, useState, useMemo } from 'react';
import { useAuth } from '../context/authContext';
import { useSocket } from '../context/socketContext';
import { getMessages } from '../services/api';
import MessageInput from './MessageInput';
import {
  formatMessageDate,
  shouldShowDateDivider,
  shouldGroupMessages,
} from '../utils/dateUtils';
import {
  ChevronDownIcon,
  CheckIcon,
  ChatBubbleLeftRightIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/solid';

const ChatWindow = ({ conversation }) => {
  const { user } = useAuth();
  const { on, off, emit, onlineUsers } = useSocket();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const markedAsReadRef = useRef(new Set());

  const convId = conversation?._id;

  const otherUser = useMemo(() => {
    if (!conversation?.participants) return null;
    return conversation.participants.find(
      (p) => String(p._id) !== String(user._id)
    );
  }, [conversation?.participants, user._id]);

  const isOnline = onlineUsers.includes(otherUser?._id);

  // Detect scroll position
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } =
      messagesContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;

    setShowScrollButton(!isAtBottom);
  };

  // Scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load messages
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

  // Join conversation room
  useEffect(() => {
    if (!convId) return;

    emit('join_conversation', convId);

    return () => {
      emit('leave_conversation', convId);
    };
  }, [convId, emit]);

  // Receive message
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

  // Message read event
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

  // Mark unread messages as read when conversation opens
  useEffect(() => {
    if (!convId || messages.length === 0) return;

    const unreadMessages = messages.filter(
      (msg) =>
        !msg.read &&
        msg.sender._id !== user._id &&
        !markedAsReadRef.current.has(msg._id)
    );

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

  // Typing indicator
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

  // Auto scroll to bottom on new messages
  useEffect(() => {
    // Only auto-scroll if user is near bottom
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } =
      messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;

    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
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
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-200 p-4">
        <img
          src={otherUser.avatar || '/avatar-default.svg'}
          alt={otherUser.username}
          className="h-10 w-10 rounded-full object-cover"
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

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="relative flex-1 overflow-y-auto p-4"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center">
            <ChatBubbleLeftRightIcon className="mb-4 h-16 w-16 text-gray-300" />
            <p className="text-center text-gray-400">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((msg, index) => {
              const isMyMessage = msg.sender._id === user._id;
              const prevMsg = index > 0 ? messages[index - 1] : null;
              const nextMsg =
                index < messages.length - 1 ? messages[index + 1] : null;

              // Show date divider
              const showDateDivider = shouldShowDateDivider(msg, prevMsg);

              // Check if message should be grouped with previous
              const isGroupedWithPrev = shouldGroupMessages(msg, prevMsg);

              // Check if message should be grouped with next
              const isGroupedWithNext = shouldGroupMessages(nextMsg, msg);

              // Determine position in group
              const isFirstInGroup = !isGroupedWithPrev;
              const isLastInGroup = !isGroupedWithNext;

              return (
                <div key={msg._id || index}>
                  {/* Date divider */}
                  {showDateDivider && (
                    <div className="my-4 flex items-center gap-4">
                      <div className="flex-1 border-t border-gray-300"></div>
                      <span className="text-xs font-medium text-gray-500">
                        {formatMessageDate(msg.createdAt)}
                      </span>
                      <div className="flex-1 border-t border-gray-300"></div>
                    </div>
                  )}

                  {/* Message */}
                  <div
                    className={`flex ${
                      isMyMessage ? 'justify-end' : 'justify-start'
                    } ${isGroupedWithPrev ? 'mt-0.5' : 'mt-4'}`}
                  >
                    {/* Avatar for other user (only show for first message in group) */}
                    {!isMyMessage && (
                      <>
                        {isFirstInGroup ? (
                          <img
                            src={msg.sender.avatar || '/avatar-default.svg'}
                            alt={msg.sender.username}
                            className="mr-2 h-8 w-8 shrink-0 rounded-full object-cover"
                            onError={(e) => {
                              e.target.src = '/avatar-default.svg';
                            }}
                          />
                        ) : (
                          <div className="mr-2 w-8 shrink-0"></div>
                        )}
                      </>
                    )}

                    {/* Message content */}
                    <div className={'max-w-xs'}>
                      {/* Message bubble */}
                      <div
                        className={`inline-block rounded-lg px-4 py-2 ${
                          isMyMessage
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        <p className="break-words">{msg.content}</p>
                      </div>

                      {/* Time and read status (only show for last message in group) */}
                      {isLastInGroup && (
                        <div
                          className={`mt-1 flex items-center gap-1 text-xs ${
                            isMyMessage ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <span className="text-gray-500">
                            {new Date(msg.createdAt).toLocaleTimeString(
                              'ko-KR',
                              {
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </span>
                          {isMyMessage && (
                            <div className="flex items-center">
                              {msg.read ? (
                                <>
                                  <CheckIcon className="h-3 w-3 text-blue-400" />
                                  <CheckIcon className="-ml-1.5 h-3 w-3 text-blue-400" />
                                </>
                              ) : (
                                <CheckIcon className="h-3 w-3 text-gray-400" />
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {isTyping && (
              <div className="mt-4 flex justify-start">
                <img
                  src={otherUser.avatar || '/avatar-default.svg'}
                  alt=""
                  className="mr-2 h-8 w-8 rounded-full object-cover"
                  onError={(e) => (e.target.src = '/avatar-default.svg')}
                />
                <div className="flex items-center rounded-lg bg-gray-200 px-4 py-2">
                  <EllipsisHorizontalIcon className="h-5 w-5 animate-pulse text-gray-600" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Scroll to bottom button */}
        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition hover:bg-blue-600 hover:shadow-xl"
            aria-label="Scroll to bottom"
          >
            <ChevronDownIcon className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Input */}
      <MessageInput convId={convId} />
    </div>
  );
};

export default ChatWindow;