import { useState } from 'react';
import { useAuth } from '../context/authContext';
import { createConversation } from '../services/api';
import Sidebar from '../components/SideBar';
import ConversationList from '../components/ConversationList';
import ChatWindow from '../components/ChatWindow';

const Chat = () => {
  const [view, setView] = useState('conversations');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const handleSelectUser = async (selectedUser) => {
    try {
      const conversation = await createConversation(
        selectedUser._id,
        user.token
      );
      setSelectedConversation(conversation);
      setView('conversations');
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* left sidebar */}
      <div className="flex w-80 shrink-0 flex-col border-r border-gray-200 bg-white">
        {/* header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 shrink-0">
              <img
                src={user.avatar || 'avatar-default.png'}
                alt={user.username}
                className="h-full w-full rounded-full object-cover"
                onError={(e) => {
                  e.target.src = '/avatar-default.png';
                }}
              />
              <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-white bg-green-500"></span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{user.username}</p>
              <p className="text-xs text-gray-500">Online</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="rounded px-3 py-1 text-sm text-red-500 hover:bg-red-50"
          >
            Logout
          </button>
        </div>

        {/* tabs */}
        <div className="flex shrink-0 border-b border-gray-200">
          <button
            onClick={() => setView('conversations')}
            className={`flex-1 py-3 text-sm font-medium ${view === 'conversations' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Chats
          </button>
          <button
            onClick={() => setView('users')}
            className={`flex-1 py-3 text-sm font-medium ${view === 'users' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Users
          </button>
        </div>

        {/* content */}
        <div className="flex-1 overflow-hidden">
          {view === 'conversations' ? (
            <ConversationList
              onSelectConversation={handleSelectConversation}
              selectedConvId={selectedConversation?._id}
            />
          ) : (
            <Sidebar onSelectUser={handleSelectUser} />
          )}
        </div>
      </div>

      {/* main chat area */}
      <div className="flex flex-1 flex-col bg-white">
        {selectedConversation ? (
          <ChatWindow conversation={selectedConversation} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-2xl font-semibold text-gray-400">
                Select a conversation
              </p>
              <p className="mt-2 text-gray-500">
                Choose a chat or start a new conversation
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
