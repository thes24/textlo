import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './authContext';
import { SocketContext } from './socketContext';

export const SocketProvider = ({ children }) => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const socketRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // connect socket
    const newSocket = io('http://localhost:3001', {
      autoConnect: true,
    });

    socketRef.current = newSocket;

    // notify that user joined
    newSocket.emit('join', user._id);

    // online user listener
    newSocket.on('user_online', (userId) => {
      setOnlineUsers((prev) => {
        if (!prev.includes(userId)) {
          return [...prev, userId];
        }
        return prev;
      });
    });

    // offline user listener
    newSocket.on('user_offline', (userId) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // cleanup
    return () => {
      console.log('Cleaning up socket connection');
      newSocket.close();
      socketRef.current = null;
      setOnlineUsers([]);
    };
  }, [user]);

  const emit = (event, data) => {
    socketRef.current?.emit(event, data);
  };

  const on = (event, callback) => {
    socketRef.current?.on(event, callback);
  };

  const off = (event, callback) => {
    socketRef.current?.off(event, callback);
  };

  const value = {
    emit,
    on,
    off,
    onlineUsers,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export default SocketProvider;
