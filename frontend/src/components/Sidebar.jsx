import { useEffect, useState } from 'react';
import { Search, LogOut, Settings as SettingsIcon, Users, X, Check, MessageSquare, ArrowLeft, User, Star, Shield, Bell, HelpCircle } from 'lucide-react';
import axios from '../utils/axiosConfig';
import useAuthStore from '../store/authStore';
import useChatStore from '../store/chatStore';
import Settings from './Settings';

const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const { 
    chats, 
    setChats, 
    selectedChat, 
    setSelectedChat, 
    showSettings, 
    setShowSettings,
    activeTab,
    setActiveTab
  } = useChatStore();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeNav, setActiveNav] = useState('chats');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupSearch, setGroupSearch] = useState('');
  const [groupSearchResults, setGroupSearchResults] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const { data } = await axios.get('/api/chats');
        setChats(data);
        
        // Calculate initial unread counts
        const counts = {};
        for (const chat of data) {
          try {
            const { data: messages } = await axios.get(`/api/messages/${chat._id}`);
            const unread = messages.filter(m => 
              m.sender._id !== user._id && !m.seenBy.includes(user._id)
            ).length;
            counts[chat._id] = unread;
          } catch (e) {}
        }
        setUnreadCounts(counts);
      } catch (error) {
        console.error('Failed to load chats');
      }
    };
    fetchChats();
  }, [setChats, user._id]);

  const handleSearch = async (query) => {
    setSearch(query);
    if (!query) {
      setSearchResults([]);
      return;
    }
    
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/users?search=${query}`);
      setSearchResults(data);
    } catch (error) {
      console.error('Error searching users');
    } finally {
      setLoading(false);
    }
  };

  const accessChat = async (userId) => {
    try {
      const { data } = await axios.post('/api/chats', { userId });
      
      if (!chats.find((c) => c._id === data._id)) {
        setChats([data, ...chats]);
      }
      setSelectedChat(data);
      setSearch('');
      setSearchResults([]);
      
      // Clear unread count when opening
      setUnreadCounts(prev => ({ ...prev, [data._id]: 0 }));
    } catch (error) {
      console.error('Error fetching chat');
    }
  };

  const handleGroupSearch = async (query) => {
    setGroupSearch(query);
    if (!query) {
      setGroupSearchResults([]);
      return;
    }
    try {
      const { data } = await axios.get(`/api/users?search=${query}`);
      setGroupSearchResults(data);
    } catch (error) {}
  };

  const handleCreateGroup = async () => {
    if (!groupName || selectedUsers.length < 1) {
      alert("Please enter a group name and select at least 1 other member.");
      return;
    }
    try {
      console.log('Attempting to create group:', { groupName, selectedUsers });
      const { data } = await axios.post('/api/chats/group', {
        name: groupName,
        users: JSON.stringify(selectedUsers.map(u => u._id))
      });
      console.log('Group created successfully:', data);
      setChats([data, ...chats]);
      setSelectedChat(data);
      setShowGroupModal(false);
      setGroupName('');
      setSelectedUsers([]);
    } catch (error) {
      console.error('Error creating group:', error.response?.data || error);
      alert(error.response?.data?.message || 'Failed to create group');
    }
  };

  const getSenderName = (chat) => {
    if (!chat) return '';
    if (chat.isGroupChat) return chat.chatName;
    if (!chat.users) return '';
    return chat.users[0]._id === user._id ? chat.users[1].name : chat.users[0].name;
  };
  
  const getSenderAvatar = (chat) => {
    if (!chat) return '';
    if (chat.isGroupChat) {
      return chat.groupIcon && chat.groupIcon !== "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"
        ? chat.groupIcon
        : `https://ui-avatars.com/api/?name=${chat.chatName}&background=random`;
    }
    if (!chat.users) return '';
    return chat.users[0]._id === user._id ? chat.users[1].avatar : chat.users[0].avatar;
  };

  return (
    <div style={{ width: 'var(--sidebar-width)', height: '100vh', background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ height: 'var(--header-height)', padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {showSettings && (
            <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <ArrowLeft size={20} />
            </button>
          )}
          <img src={user.avatar} alt={user.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
          <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>{showSettings ? 'Settings' : user.name}</span>
        </div>
        <button onClick={logout} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} title="Logout">
          <LogOut size={20} />
        </button>
      </div>

      {showSettings ? (
        <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-primary)' }}>
          <div style={{ padding: '0.5rem 0' }}>
            {[
              { id: 'account', icon: User, label: 'Account' },
              { id: 'favorites', icon: Star, label: 'Favorites' },
              { id: 'privacy', icon: Shield, label: 'Privacy' },
              { id: 'notifications', icon: Bell, label: 'Notifications' },
              { id: 'help', icon: HelpCircle, label: 'Help' }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <div 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{ 
                    padding: '1rem 1.5rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1rem', 
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border-color)',
                    background: isActive ? 'var(--bg-tertiary)' : 'transparent',
                    color: isActive ? 'var(--accent-primary)' : 'var(--text-primary)',
                    transition: 'var(--transition)'
                  }}
                  onMouseOver={(e) => { if(!isActive) e.currentTarget.style.background = 'var(--bg-tertiary)' }}
                  onMouseOut={(e) => { if(!isActive) e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: isActive ? 'var(--accent-primary)' : 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isActive ? 'white' : 'var(--accent-primary)' }}>
                    <Icon size={20} />
                  </div>
                  <span style={{ fontWeight: isActive ? '600' : '500' }}>{tab.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <>
          {/* Search & Actions Bar */}
          <div style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '20px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>
            <button 
              onClick={() => setShowGroupModal(true)}
              style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--accent-primary)' }}
              title="New Group"
            >
              <Users size={20} />
            </button>
          </div>

          {/* Chat List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {search ? (
              <div>
                <div style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Search Results</div>
                {loading ? (
                  <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Searching...</div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((searchUser) => (
                    <div 
                      key={searchUser._id} 
                      onClick={() => accessChat(searchUser._id)}
                      style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: 'var(--transition)', borderBottom: '1px solid var(--border-color)' }}
                      className="chat-item-hover"
                      onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <img src={searchUser.avatar} alt={searchUser.name} style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontWeight: '500' }}>{searchUser.name}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{searchUser.email}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No users found.</div>
                )}
              </div>
            ) : (
              <div>
                {chats.map((chat) => (
                  <div 
                    key={chat._id} 
                    onClick={() => setSelectedChat(chat)}
                    style={{ 
                      padding: '1rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '1rem', 
                      cursor: 'pointer', 
                      background: selectedChat?._id === chat._id ? 'var(--bg-tertiary)' : 'transparent',
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'var(--transition)'
                    }}
                    onMouseOver={(e) => { if(selectedChat?._id !== chat._id) e.currentTarget.style.background = 'rgba(51, 65, 85, 0.5)' }}
                    onMouseOut={(e) => { if(selectedChat?._id !== chat._id) e.currentTarget.style.background = 'transparent' }}
                  >
                    <img src={getSenderAvatar(chat)} alt="avatar" style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <div style={{ fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {getSenderName(chat)}
                        </div>
                        {unreadCounts[chat._id] > 0 && (
                          <div style={{ background: 'var(--accent-primary)', color: 'white', minWidth: '18px', height: '18px', borderRadius: '9px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', fontWeight: 'bold' }}>
                            {unreadCounts[chat._id]}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: unreadCounts[chat._id] > 0 ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: unreadCounts[chat._id] > 0 ? '600' : '400', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '4px' }}>
                        {chat.latestMessage ? chat.latestMessage.content : 'Start a conversation'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Group Modal */}
      {showGroupModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '90%', maxWidth: '400px', background: 'var(--bg-secondary)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Create New Group</h3>
              <X style={{ cursor: 'pointer' }} onClick={() => setShowGroupModal(false)} />
            </div>
            
            <input 
              type="text" 
              placeholder="Group Name" 
              className="input-field" 
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              style={{ marginBottom: '1rem' }}
            />

            <div style={{ marginBottom: '1rem' }}>
              <input 
                type="text" 
                placeholder="Add Members" 
                className="input-field" 
                value={groupSearch}
                onChange={(e) => handleGroupSearch(e.target.value)}
              />
              {groupSearchResults.length > 0 && (
                <div style={{ maxHeight: '150px', overflowY: 'auto', background: 'var(--bg-primary)', borderRadius: '8px', marginTop: '0.5rem' }}>
                  {groupSearchResults.map(u => (
                    <div 
                      key={u._id} 
                      onClick={() => {
                        if (!selectedUsers.find(su => su._id === u._id)) setSelectedUsers([...selectedUsers, u]);
                        setGroupSearch('');
                        setGroupSearchResults([]);
                      }}
                      style={{ padding: '0.5rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <img src={u.avatar} alt={u.name} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                      <span>{u.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {selectedUsers.map(u => (
                <div key={u._id} style={{ background: 'var(--accent-primary)', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {u.name} <X size={14} style={{ cursor: 'pointer' }} onClick={() => setSelectedUsers(selectedUsers.filter(su => su._id !== u._id))} />
                </div>
              ))}
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%' }}
              disabled={!groupName || selectedUsers.length < 1}
              onClick={handleCreateGroup}
            >
              Create Group
            </button>
          </div>
        </div>
      )}

      {/* Bottom Bar */}
      <div style={{ 
        height: 'var(--bottom-bar-height)', 
        background: 'var(--bg-secondary)', 
        borderTop: '1px solid var(--border-color)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-around',
        padding: '0.5rem 0'
      }}>
        <button 
          onClick={() => {
            setActiveNav('chats');
            setShowSettings(false);
          }}
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            color: (!showSettings && activeNav === 'chats') ? 'var(--accent-primary)' : 'var(--text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.75rem'
          }}
        >
          <MessageSquare size={22} />
          <span>Chats</span>
        </button>
        <button 
          onClick={() => setShowSettings(true)}
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            color: showSettings ? 'var(--accent-primary)' : 'var(--text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.75rem'
          }}
        >
          <SettingsIcon size={22} />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
