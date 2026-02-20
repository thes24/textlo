import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/authContext';
import AuthProvider from './context/authProvider';
import SocketProvider from './context/socketProvider';
import Login from './pages/login';
import Register from './pages/register';
import Chat from './pages/chat';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
