import { useEffect } from 'react';
import useAuthStore from '../store/authStore';
import useChatStore from '../store/chatStore';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import Settings from '../components/Settings';
import logo from '../assets/logo_pm.svg';

const ChatPage = () => {
  const { user } = useAuthStore();
  const { selectedChat } = useChatStore();

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}>
      <div className={selectedChat ? 'hidden-mobile' : ''} style={{ width: 'var(--sidebar-width)', height: '100%' }}>
        <Sidebar />
      </div>
      <div 
        className={!selectedChat ? 'hidden-mobile' : ''} 
        style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', position: 'relative' }}
      >
        {selectedChat ? (
          <ChatWindow />
        ) : (
          <div className="flex-center" style={{ height: '100%', flexDirection: 'column', color: 'var(--text-secondary)' }}>
            <div style={{ width: '80px', height: '80px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={logo} alt="PingMe Logo" style={{ width: '100%', height: '100%' }} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>PingMe Web</h2>
            <p>Select a user to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
