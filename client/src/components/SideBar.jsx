import { useEffect, useState } from 'react';
import { useAuth } from '../context/authContext';
import { useSocket } from '../context/socketContext';
import { getUsers } from '../services/api';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const Sidebar = ({ onSelectUser }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { onlineUsers } = useSocket();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getUsers(user.token);
        // Filter out current user
        const filtered = data.filter((u) => u._id !== user._id);
        setUsers(filtered);
        setFilteredUsers(filtered); // ✅ Initialize filteredUsers
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user.token, user._id]);

  // Filter users based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter((u) =>
        u.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const isOnline = (userId) => onlineUsers.includes(userId);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
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

      {/* Search Bar */}
      <div className="shrink-0 border-b border-gray-200 p-3">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pr-10 pl-10 text-sm focus:border-blue-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')} // ✅ Arrow function
              className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" /> {/* ✅ Icon instead of "x" */}
            </button>
          )}
        </div>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto">
        {filteredUsers.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-8">
            <UserGroupIcon className="mb-4 h-16 w-16 text-gray-300" />
            <p className="text-center text-gray-400">
              {searchQuery ? 'No users found' : 'No users available'}
            </p>
          </div>
        ) : (
          filteredUsers.map((u) => (
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
          ))
        )}
      </div>
    </div>
  );
};

export default Sidebar;
