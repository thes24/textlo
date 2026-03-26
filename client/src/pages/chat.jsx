import { useState } from 'react';
import { useAuth } from '../context/authContext';
import { createConversation } from '../services/api';
import Sidebar from '../components/SideBar';
import ConversationList from '../components/ConversationList';
import ChatWindow from '../components/ChatWindow';
import ProfileModal from '../components/ProfileModal';
import { UserCircleIcon } from '@heroicons/react/24/outline';

const Chat = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('conversations');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

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
      setActiveTab('conversations');
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="flex w-80 flex-col border-r border-gray-200">
        {/* Header with Profile button */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white p-4">
          <h1 className="text-xl font-bold text-blue-500">Textlo</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowProfileModal(true)}
              className="rounded-full p-2 hover:bg-gray-100"
              title="Profile"
            >
              <UserCircleIcon className="h-6 w-6 text-gray-600" />
            </button>
            <button
              onClick={logout}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('conversations')}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activeTab === 'conversations'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Messages
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activeTab === 'users'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Users
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'conversations' ? (
            <ConversationList
              onSelectConversation={handleSelectConversation}
              selectedConversationId={selectedConversation?._id}
            />
          ) : (
            <Sidebar onSelectUser={handleSelectUser} />
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1">
        {selectedConversation ? (
          <ChatWindow conversation={selectedConversation} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-gray-400">
              Select a conversation to start messaging
            </p>
          </div>
        )}
      </div>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
};

export default Chat;
