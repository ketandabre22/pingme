import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ChatPage from './pages/ChatPage';
import './index.css';

function App() {
  const { user } = useAuthStore();

  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route 
            path="/" 
            element={user ? <Navigate to="/chats" /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/login" 
            element={user ? <Navigate to="/chats" /> : <Login />} 
          />
          <Route 
            path="/signup" 
            element={user ? <Navigate to="/chats" /> : <Signup />} 
          />
          <Route 
            path="/chats" 
            element={user ? <ChatPage /> : <Navigate to="/login" />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
