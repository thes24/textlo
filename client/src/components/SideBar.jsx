import { useEffect, useState } from 'react';
import { useAuth } from '../context/authContext';
import { useSocket } from '../context/socketContext';
import { getUsers } from '../services/api';

const Sidebar = ({ onSelectUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { onlineUsers } = useSocket();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getUsers(user.token);
        setUsers(data);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user.token]);

  const isOnline = (userId) => onlineUsers.includes(userId);

  if (loading) {
    return (
      <div className="felx h-full items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-lg font-semibold">Users</h2>
        <p className="text-sm text-gray-500">{users.length} users</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {users.map((u) => (
          <button
            key={u._id}
            onClick={() => onSelectUser(u)}
            className="flex w-full items-center gap-3 border-b border-gray-100 p-4 transition hover:bg-gray-50"
          >
            {/* avatar */}
            <div className="relative">
              <img
                src={u.avatar}
                alt={u.username}
                className="h-12 w-12 rounded-full"
              />
              {/* online indicator */}
              {isOnline(u._id) && (
                <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-white bg-green-500"></span>
              )}
            </div>

            {/* user info */}
            <div className="flex-1 text-left">
              <p className="font-medium">{u.username}</p>
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
