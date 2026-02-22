import { useState, useEffect } from 'react';
import { useAuth } from '../context/authContext';
import { useSocket } from '../context/socketContext';
import { getConversations } from '../services/api';

const ConversationList = ({ onSelectConversation, selectedConvId }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { onlineUsers } = useSocket();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await getConversations(user.token);
        setConversations(data);
      } catch (error) {
        console.error('Failed to fetch conversations', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [user.token]);

  const getOtherParticipant = (conversation) => {
    return conversation.participants.find((p) => p._id !== user._id);
  };

  const isOnline = (userId) => onlineUsers.includes(userId);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-center text-gray-400">
          No conversations yet
          <br />
          <span className="text-sm">Select a user to start chatting</span>
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-lg font-semibold">Messages</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.map((conv) => {
          const otherUser = getOtherParticipant(conv);
          const isSelected = conv._id === selectedConvId;

          return (
            <button
              key={conv._id}
              onClick={() => onSelectConversation(conv)}
              className={`flex w-full items-center gap-3 border-b border-gray-100 p-4 transition ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
            >
              {/* avatar */}
              <div className="relative">
                <img
                  src={otherUser.avatar}
                  alt={otherUser.username}
                  className="h-12 w-12 rounded-full"
                />
                {isOnline(otherUser._id) && (
                  <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-white bg-green-500"></span>
                )}
              </div>

              {/* conversation info */}
              <div className="flex-1 text-left">
                <p className="font-medium">{otherUser.username}</p>
                {conv.lastMessage && (
                  <p className="truncate text-sm text-gray-500">
                    {conv.lastMessage.content}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ConversationList;
