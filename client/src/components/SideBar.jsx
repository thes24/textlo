import { useEffect, useState } from 'react';
import { useAuth } from '../context/authContext';
import { useSocket } from '../context/socketContext';
import { getUsers } from '../services/api';
import { UserGroupIcon } from '@heroicons/react/24/outline';

const Sidebar = ({ onSelectUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { onlineUsers } = useSocket();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getUsers(user.token);
        // filter out current user
        const filteredUsers = data.filter((u) => u._id !== user._id);
        setUsers(filteredUsers);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user.token, user._id]);

  const isOnline = (userId) => onlineUsers.includes(userId);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <UserGroupIcon className="mb-4 h-16 w-16 text-gray-300" />
        <p className="text-center text-gray-400">No users found</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 p-4">
        <h2 className="text-lg font-semibold">Users</h2>
        <p className="text-sm text-gray-500">{users.length} available</p>
      </div>

      {/* User list */}
      <div className="flex-1 overflow-y-auto">
        {users.map((u) => (
          <button
            key={u._id}
            onClick={() => onSelectUser(u)}
            className="flex w-full items-center gap-3 border-b border-gray-100 p-4 transition hover:bg-gray-50"
          >
            {/* Avatar with online indicator */}
            <div className="relative shrink-0">
              <img
                src={u.avatar || '/avatar-default.svg'}
                alt={u.username}
                className="h-12 w-12 rounded-full object-cover"
                onError={(e) => {
                  e.target.src = '/avatar-default.svg';
                }}
              />
              {/* Online indicator */}
              {isOnline(u._id) && (
                <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-white bg-green-500"></span>
              )}
            </div>

            {/* User info */}
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate font-medium">{u.username}</p>
              <p className="text-sm text-gray-500">
                {isOnline(u._id) ? 'Online' : 'Offline'}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
