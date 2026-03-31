import { useState, useEffect } from 'react';
import { useAuth } from '../context/authContext';
import { useSocket } from '../context/socketContext';
import { getConversations } from '../services/api';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';

const getRelativeTime = (date) => {
  const now = new Date();
  const msgDate = new Date(date);
  const diffInSecs = Math.floor((now - msgDate) / 1000);

  if (diffInSecs < 60) return '방금 전';
  if (diffInSecs < 3600) return `${Math.floor(diffInSecs / 60)}분 전`;
  if (diffInSecs < 86400) return `${Math.floor(diffInSecs / 3600)}시간 전`;
  if (diffInSecs < 172800) return '어제';
  if (diffInSecs < 604800) return `${Math.floor(diffInSecs / 86400)}일 전`;

  return msgDate.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  });
};

const ConversationList = ({ onSelectConversation, selectedConvId }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { onlineUsers, on, off } = useSocket();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await getConversations(user.token);
        const sorted = data.sort((a, b) => {
          const aTime = a.lastMessage?.createdAt || a.createdAt;
          const bTime = b.lastMessage?.createdAt || b.createdAt;
          return new Date(bTime) - new Date(aTime);
        });
        setConversations(sorted);
      } catch (error) {
        console.error('Failed to fetch conversations', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [user.token]);

  useEffect(() => {
    const handleReceiveMessage = (message) => {
      setConversations((prev) => {
        const updated = prev.map((conv) => {
          if (conv._id === message.convId) {
            const newUnreadCount =
              message.sender._id !== user._id
                ? (conv.unreadCount || 0) + 1
                : conv.unreadCount || 0;

            return {
              ...conv,
              lastMessage: {
                content: message.content,
                createdAt: message.createdAt,
                sender: message.sender,
              },
              unreadCount: newUnreadCount,
            };
          }
          return conv;
        });

        return updated.sort((a, b) => {
          const aTime = a.lastMessage?.createdAt || a.createdAt;
          const bTime = b.lastMessage?.createdAt || b.createdAt;
          return new Date(bTime) - new Date(aTime);
        });
      });
    };

    const handleUnreadCountUpdated = ({ convId, count }) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === convId ? { ...conv, unreadCount: count } : conv
        )
      );
    };

    on('receive_message', handleReceiveMessage);
    on('unread_count_updated', handleUnreadCountUpdated);

    return () => {
      off('receive_message', handleReceiveMessage);
      off('unread_count_updated', handleUnreadCountUpdated);
    };
  }, [on, off, user._id]);

  useEffect(() => {
    if (selectedConvId) {
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === selectedConvId ? { ...conv, unreadCount: 0 } : conv
        )
      );
    }
  }, [selectedConvId]);

  const getOtherUser = (conversation) => {
    return conversation.participants.find((p) => p._id !== user._id);
  };

  const isOnline = (userId) => onlineUsers.includes(userId);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <ChatBubbleLeftRightIcon className="mb-4 h-16 w-16 text-gray-300" />
        <p className="text-center text-gray-400">
          No conversations yet
          <br />
          <span className="text-sm">Click "Users" to start chatting</span>
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-gray-200 p-4">
        <h2 className="text-lg font-semibold">Messages</h2>
        <p className="text-sm text-gray-500">
          {conversations.length} conversations
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.map((conv) => {
          const otherUser = getOtherUser(conv);
          const isSelected = conv._id === selectedConvId;
          const hasLastMessage = conv.lastMessage;
          const unreadCount = conv.unreadCount || 0;

          const isMyMessage =
            hasLastMessage && conv.lastMessage.sender?._id === user._id;

          return (
            <button
              key={conv._id}
              onClick={() => onSelectConversation(conv)}
              className={`flex w-full items-center gap-3 border-b border-gray-100 p-4 transition hover:bg-gray-50 ${
                isSelected ? 'bg-blue-50' : ''
              }`}
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <img
                  src={otherUser?.avatar || '/avatar-default.svg'}
                  alt={otherUser?.username || 'User'}
                  className="h-14 w-14 rounded-full object-cover"
                  onError={(e) => {
                    e.target.src = '/avatar-default.svg';
                  }}
                />
                {isOnline(otherUser._id) && (
                  <span className="absolute right-0 bottom-0 h-4 w-4 rounded-full border-2 border-white bg-green-500"></span>
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1 text-left">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="truncate font-semibold text-gray-900">
                    {otherUser?.username || 'Unknown'}
                  </h3>
                  {hasLastMessage && (
                    <span className="shrink-0 text-xs text-gray-500">
                      {getRelativeTime(conv.lastMessage.createdAt)}
                    </span>
                  )}
                </div>

                <div className="mt-1 flex items-center justify-between gap-2">
                  {hasLastMessage ? (
                    <p className="truncate text-sm text-gray-600">
                      {isMyMessage && (
                        <span className="mr-1 text-gray-400">나:</span>
                      )}
                      {conv.lastMessage.content || '사진'}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 italic">
                      No messages yet
                    </p>
                  )}

                  {/* Unread Badge */}
                  {unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1.5 text-xs font-semibold text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ConversationList;
