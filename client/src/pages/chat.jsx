// temp
import { useEffect, useState } from 'react';
import { useAuth } from '../context/authContext';
import { useSocket } from '../context/socketContext';

const Chat = () => {
  const { user, logout } = useAuth();
  const { emit, on, off, onlineUsers } = useSocket();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');

  useEffect(() => {
    const handleReceiveMessage = (message) => {
      console.log('Received message:', message);
      setMessages((prev) => [...prev, message]);
    };

    on('receive_message', handleReceiveMessage);

    return () => {
      off('receive_message', handleReceiveMessage);
    };
  }, [on, off]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    // test
    emit('send_message', {
      convId: 'REAL_ID_REQUIRED', // REAL ID REQUIRED
      content: inputMessage,
      senderId: user._id,
    });

    setInputMessage('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-4 rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Welcome, {user.username}!</h1>
              <p className="mt-1 text-sm text-gray-600">
                Online users: {onlineUsers.length}
              </p>
            </div>
            <button
              onClick={logout}
              className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Chat (Test)</h2>
          {/* Messages */}
          <div className="mb-4 h-64 overflow-y-auto rounded border border-gray-200 p-4">
            {messages.length === 0 ? (
              <p className="text-center text-gray-400">No messages yet</p>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className="mb-2">
                  <span className="font-semibold">
                    {msg.sender?.username || 'Unknown'}:
                  </span>{' '}
                  <span>{msg.content}</span>
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={3}
              className="flex-1 resize-none rounded border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={handleSendMessage}
              className="rounded bg-blue-500 px-6 py-2 text-white hover:bg-blue-600"
            >
              Send
            </button>
          </div>

          {/* Debug */}
          <div className="mt-4 rounded bg-gray-50 p-4 text-sm">
            <p className="font-semibold">Debug Info:</p>
            <p>User ID {user._id}</p>
            <p>Username: {user.username}</p>
            <p>Online Users: {JSON.stringify(onlineUsers)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
