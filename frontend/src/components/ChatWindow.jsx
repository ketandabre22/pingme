import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import axios from '../utils/axiosConfig';
import useAuthStore from '../store/authStore';
import useChatStore from '../store/chatStore';
import { Send, Check, ArrowLeft, Star, Info, MoreVertical, Edit2, Trash2, X } from 'lucide-react';
import GroupSettingsModal from './GroupSettingsModal';
import { format } from 'date-fns';

const ENDPOINT = import.meta.env.VITE_API_URL || 'http://localhost:5009';
var socket, selectedChatCompare;

const ChatWindow = () => {
  const { user, updateSettings } = useAuthStore();
  const { selectedChat, setSelectedChat, messages, setMessages, addMessage } = useChatStore();
  
  const [newMessage, setNewMessage] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [showMsgOptions, setShowMsgOptions] = useState(null);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit('setup', user);
    socket.on('connected', () => setSocketConnected(true));
    socket.on('typing', () => setIsTyping(true));
    socket.on('stop typing', () => setIsTyping(false));

    return () => {
      socket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat) return;
      try {
        setLoading(true);
        const { data } = await axios.get(`/api/messages/${selectedChat._id}`);
        setMessages(data);
        setLoading(false);
        socket.emit('join chat', selectedChat._id);
        
        // Mark messages as seen
        await axios.put(`/api/messages/seen/${selectedChat._id}`);
      } catch (error) {
        console.error('Failed to load messages');
        setLoading(false);
      }
    };

    fetchMessages();
    selectedChatCompare = selectedChat;
  }, [selectedChat, setMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    socket.on('message recieved', (newMessageRecieved) => {
      if (!selectedChatCompare || selectedChatCompare._id !== newMessageRecieved.chat._id) {
        // Notification logic
      } else {
        addMessage(newMessageRecieved);
      }
    });

    socket.on('message updated', (updatedMessage) => {
      if (selectedChatCompare && selectedChatCompare._id === updatedMessage.chat._id) {
        setMessages(messages.map(m => m._id === updatedMessage._id ? updatedMessage : m));
      }
    });
    
    return () => {
      socket.off('message recieved');
      socket.off('message updated');
    };
  });

  const sendMessage = async (e) => {
    if (e.key === 'Enter' && newMessage) {
      socket.emit('stop typing', selectedChat._id);
      try {
        const content = newMessage;
        setNewMessage('');
        const { data } = await axios.post('/api/messages', {
          content,
          chatId: selectedChat._id,
        });
        socket.emit('new message', data);
        addMessage(data);
      } catch (error) {
        console.error('Failed to send message');
      }
    }
  };
  
  const sendButtonClicked = async () => {
    if (editingMessage) {
      handleEditMessage();
      return;
    }
    if (newMessage) {
      socket.emit('stop typing', selectedChat._id);
      try {
        const content = newMessage;
        setNewMessage('');
        const { data } = await axios.post('/api/messages', {
          content,
          chatId: selectedChat._id,
        });
        socket.emit('new message', data);
        addMessage(data);
      } catch (error) {
        console.error('Failed to send message');
      }
    }
  };

  const handleEditMessage = async () => {
    if (!editContent || !editingMessage) return;
    try {
      const { data } = await axios.put('/api/messages/edit', {
        messageId: editingMessage._id,
        content: editContent
      });
      // Update message in store
      const updatedMessages = messages.map(m => m._id === data._id ? data : m);
      setMessages(updatedMessages);
      setEditingMessage(null);
      setEditContent('');
      // Notify via socket
      socket.emit('message edited', data);
    } catch (error) {
      console.error('Error editing message');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const { data } = await axios.put('/api/messages/delete', { messageId });
      const updatedMessages = messages.map(m => m._id === data._id ? data : m);
      setMessages(updatedMessages);
      setShowMsgOptions(null);
      // Notify via socket
      socket.emit('message deleted', data);
    } catch (error) {
      console.error('Error deleting message');
    }
  };

  const typingHandler = (e) => {
    setNewMessage(e.target.value);

    if (!socketConnected) return;

    if (!typing) {
      setTyping(true);
      socket.emit('typing', selectedChat._id);
    }
    
    let lastTypingTime = new Date().getTime();
    var timerLength = 3000;
    setTimeout(() => {
      var timeNow = new Date().getTime();
      var timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= timerLength && typing) {
        socket.emit('stop typing', selectedChat._id);
        setTyping(false);
      }
    }, timerLength);
  };

  const getSender = (chat) => {
    if (!chat) return {};
    if (chat.isGroupChat) return { name: chat.chatName, avatar: `https://ui-avatars.com/api/?name=${chat.chatName}&background=random`, isGroup: true, users: chat.users };
    return chat.users[0]._id === user._id ? chat.users[1] : chat.users[0];
  };

  const sender = getSender(selectedChat);
  const isFavorite = user.favorites?.some(f => f === sender._id || f._id === sender._id);

  const toggleFavorite = async () => {
    try {
      const { data } = await axios.post('/api/users/favorites', { targetUserId: sender._id });
      updateSettings({ favorites: data });
    } catch (error) {
      console.error('Failed to toggle favorite');
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div style={{ height: 'var(--header-height)', padding: '0 1.5rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            className="md:hidden" 
            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            onClick={() => setSelectedChat(null)}
          >
            <ArrowLeft size={24} />
          </button>
          <img src={sender.avatar} alt={sender.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
          <div>
            <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>{sender.name}</div>
            {isTyping ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontStyle: 'italic' }}>typing...</div>
            ) : sender.isGroup ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {sender.users.length} members
              </div>
            ) : (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {sender.isOnline ? 'Online' : sender.about || 'Available'}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {!sender.isGroup && (
            <button 
              onClick={toggleFavorite}
              style={{ background: 'none', border: 'none', cursor: 'pointer', transition: 'var(--transition)' }}
              title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
            >
              <Star size={24} fill={isFavorite ? 'var(--warning)' : 'none'} color={isFavorite ? 'var(--warning)' : 'var(--text-secondary)'} />
            </button>
          )}
          {sender.isGroup && (
            <button 
              onClick={() => setShowGroupSettings(true)}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'var(--transition)' }}
              title="Group Settings"
              onMouseOver={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
              onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              <Info size={24} />
            </button>
          )}
        </div>

        <GroupSettingsModal 
          isOpen={showGroupSettings} 
          onClose={() => setShowGroupSettings(false)} 
        />
      </div>

      {/* Messages */}
      <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {loading ? (
          <div className="flex-center" style={{ height: '100%', color: 'var(--text-secondary)' }}>Loading messages...</div>
        ) : (
          messages.map((m, i) => {
            const isMyMessage = m.sender._id === user._id;
            return (
              <div key={m._id} style={{ display: 'flex', justifyContent: isMyMessage ? 'flex-end' : 'flex-start', marginBottom: '0.5rem', position: 'relative' }}>
                {!isMyMessage && selectedChat.isGroupChat && (
                  <img src={m.sender.avatar} style={{ width: '28px', height: '28px', borderRadius: '50%', marginRight: '0.5rem', marginTop: 'auto' }} title={m.sender.name} />
                )}
                <div 
                  onMouseEnter={() => setShowMsgOptions(m._id)}
                  onMouseLeave={() => setShowMsgOptions(null)}
                  style={{ 
                    maxWidth: '75%', 
                    padding: '0.75rem 1rem', 
                    borderRadius: '16px',
                    background: isMyMessage ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                    color: isMyMessage ? '#fff' : 'var(--text-primary)',
                    borderBottomRightRadius: isMyMessage ? '4px' : '16px',
                    borderBottomLeftRadius: !isMyMessage ? '4px' : '16px',
                    boxShadow: 'var(--shadow-sm)',
                    position: 'relative'
                  }}
                >
                  {!isMyMessage && selectedChat.isGroupChat && (
                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem', color: 'var(--accent-primary)' }}>{m.sender.name}</div>
                  )}
                  <div style={{ wordBreak: 'break-word', fontStyle: m.isDeleted ? 'italic' : 'normal', opacity: m.isDeleted ? 0.7 : 1 }}>
                    {m.content}
                    {m.isEdited && !m.isDeleted && <span style={{ fontSize: '0.6rem', marginLeft: '0.5rem', opacity: 0.6 }}>(edited)</span>}
                  </div>
                  <div style={{ fontSize: '0.65rem', textAlign: 'right', marginTop: '0.25rem', color: isMyMessage ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)' }}>
                    {format(new Date(m.createdAt), 'p')}
                  </div>

                  {isMyMessage && !m.isDeleted && showMsgOptions === m._id && (
                    <div style={{ position: 'absolute', top: '-10px', left: '-30px', background: 'var(--bg-secondary)', borderRadius: '8px', boxShadow: 'var(--shadow-md)', display: 'flex', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                      <button onClick={() => { setEditingMessage(m); setEditContent(m.content); }} style={{ padding: '0.4rem', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }} title="Edit"><Edit2 size={14}/></button>
                      <button onClick={() => handleDeleteMessage(m._id)} style={{ padding: '0.4rem', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }} title="Delete"><Trash2 size={14}/></button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div style={{ height: 'var(--bottom-bar-height)', padding: '0 1.5rem', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', position: 'relative' }}>
        {editingMessage && (
          <div style={{ position: 'absolute', bottom: 'var(--bottom-bar-height)', left: 0, width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(59, 130, 246, 0.95)', padding: '0.5rem 1.5rem', backdropFilter: 'blur(8px)', fontSize: '0.85rem', borderTop: '1px solid var(--border-color)', zIndex: 10 }}>
            <span>Editing message...</span>
            <X size={16} style={{ cursor: 'pointer' }} onClick={() => { setEditingMessage(null); setEditContent(''); }} />
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
          <input
            type="text"
            placeholder={editingMessage ? "Edit message..." : "Type a message..."}
            value={editingMessage ? editContent : newMessage}
            onChange={(e) => editingMessage ? setEditContent(e.target.value) : typingHandler(e)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (editingMessage) handleEditMessage();
                else sendMessage(e);
              }
            }}
            style={{ flex: 1, padding: '0.75rem 1.25rem', borderRadius: '24px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem' }}
          />
          <button 
            onClick={sendButtonClicked}
            style={{ background: 'var(--accent-primary)', color: 'white', border: 'none', width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'var(--transition)', flexShrink: 0 }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {editingMessage ? <Check size={20} /> : <Send size={20} style={{ marginLeft: '2px' }} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
