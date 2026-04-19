import { useEffect } from 'react';
import useAuthStore from '../store/authStore';
import useChatStore from '../store/chatStore';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import Settings from '../components/Settings';
import CreateGroupModal from '../components/CreateGroupModal';
import GroupSettingsModal from '../components/GroupSettingsModal';
import logo from '../assets/logo_pm.svg';
import io from 'socket.io-client';

const ENDPOINT = import.meta.env.VITE_API_URL || 'http://localhost:5009';

const ChatPage = () => {
  const { user } = useAuthStore();
  const { selectedChat, showSettings, socket, setSocket, showGroupSettings, setShowGroupSettings } = useChatStore();

  useEffect(() => {
    const newSocket = io(ENDPOINT);
    newSocket.emit('setup', user);
    setSocket(newSocket);

    newSocket.on('message recieved', (newMessageRecieved) => {
      // Emit delivered event immediately
      newSocket.emit('message delivered', { 
        messageId: newMessageRecieved._id, 
        userId: user._id, 
        chatId: newMessageRecieved.chat._id 
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}>
      <div className={(selectedChat || showSettings) ? 'hidden-mobile' : ''} style={{ width: 'var(--sidebar-width)', height: '100%' }}>
        <Sidebar />
      </div>
      <div 
        className={(!selectedChat && !showSettings) ? 'hidden-mobile' : ''} 
        style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', position: 'relative' }}
      >
        {showSettings ? (
          <Settings />
        ) : selectedChat ? (
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
      <CreateGroupModal />
      <GroupSettingsModal 
        isOpen={showGroupSettings} 
        onClose={() => setShowGroupSettings(false)} 
      />
    </div>
  );
};

export default ChatPage;
