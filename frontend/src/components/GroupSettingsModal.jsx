import React, { useState, useRef } from 'react';
import { X, UserPlus, LogOut, Edit3, Check, Trash2, Camera } from 'lucide-react';
import axios from '../utils/axiosConfig';
import useChatStore from '../store/chatStore';
import useAuthStore from '../store/authStore';

const GroupSettingsModal = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const { selectedChat, setSelectedChat, setChats, chats } = useChatStore();
  const fileInputRef = useRef(null);
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [groupName, setGroupName] = useState(selectedChat?.chatName || '');
  const [memberSearch, setMemberSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [iconPreview, setIconPreview] = useState(selectedChat?.groupIcon);

  if (!isOpen || !selectedChat) return null;

  const isAdmin = selectedChat.groupAdmin._id === user._id;

  const handleIconChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;
      setIconPreview(base64String);
      
      try {
        setLoading(true);
        const { data } = await axios.put('/api/chats/groupicon', {
          chatId: selectedChat._id,
          groupIcon: base64String,
        });
        setSelectedChat(data);
        setChats(chats.map(c => c._id === data._id ? data : c));
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to update group icon');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRename = async () => {
    if (!groupName || groupName === selectedChat.chatName) {
      setIsEditingName(false);
      return;
    }
    try {
      setLoading(true);
      const { data } = await axios.put('/api/chats/rename', {
        chatId: selectedChat._id,
        chatName: groupName,
      });
      setSelectedChat(data);
      setChats(chats.map(c => c._id === data._id ? data : c));
      setIsEditingName(false);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to rename group');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchMembers = async (query) => {
    setMemberSearch(query);
    if (!query) {
      setSearchResults([]);
      return;
    }
    try {
      const { data } = await axios.get(`/api/users?search=${query}`);
      // Filter out users already in the group
      const filteredResults = data.filter(u => !selectedChat.users.some(mu => mu._id === u._id));
      setSearchResults(filteredResults);
    } catch (error) {}
  };

  const handleAddMember = async (targetUser) => {
    try {
      setLoading(true);
      const { data } = await axios.put('/api/chats/groupadd', {
        chatId: selectedChat._id,
        userId: targetUser._id,
      });
      setSelectedChat(data);
      setChats(chats.map(c => c._id === data._id ? data : c));
      setMemberSearch('');
      setSearchResults([]);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    try {
      setLoading(true);
      const { data } = await axios.put('/api/chats/groupremove', {
        chatId: selectedChat._id,
        userId: userId,
      });
      setSelectedChat(data);
      setChats(chats.map(c => c._id === data._id ? data : c));
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to remove member');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;
    try {
      setLoading(true);
      await axios.put('/api/chats/groupremove', {
        chatId: selectedChat._id,
        userId: user._id,
      });
      setChats(chats.filter(c => c._id !== selectedChat._id));
      setSelectedChat(null);
      onClose();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to leave group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
      <div style={{ width: '90%', maxWidth: '500px', background: 'var(--bg-secondary)', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', animation: 'fadeIn 0.2s ease-out' }}>
        {/* Header */}
        <div style={{ padding: '1.5rem', background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Group Settings</h3>
          <X style={{ cursor: 'pointer' }} onClick={onClose} />
        </div>

        <div style={{ padding: '2rem', maxHeight: '70vh', overflowY: 'auto' }}>
          {/* Group Icon Section */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2.5rem' }}>
            <div style={{ position: 'relative', width: '120px', height: '120px' }}>
              <img 
                src={iconPreview || `https://ui-avatars.com/api/?name=${selectedChat.chatName}&background=random`} 
                alt="Group Icon" 
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--bg-tertiary)', boxShadow: 'var(--shadow-md)' }} 
              />
              {isAdmin && (
                <>
                  <button 
                    onClick={() => fileInputRef.current.click()}
                    style={{ position: 'absolute', bottom: '0', right: '0', background: 'var(--accent-primary)', color: 'white', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'var(--shadow-lg)' }}
                    title="Change Group Icon"
                  >
                    <Camera size={20} />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleIconChange} 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                  />
                </>
              )}
            </div>
            {loading && <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', marginTop: '0.5rem' }}>Uploading...</div>}
          </div>

          {/* Group Name Section */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '0.75rem' }}>Group Name</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {isEditingName ? (
                <div style={{ display: 'flex', flex: 1, gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={groupName} 
                    onChange={(e) => setGroupName(e.target.value)} 
                    autoFocus
                  />
                  <button onClick={handleRename} className="btn btn-primary" style={{ padding: '0.5rem' }}>
                    <Check size={20} />
                  </button>
                </div>
              ) : (
                <>
                  <span style={{ fontSize: '1.5rem', fontWeight: '600', flex: 1 }}>{selectedChat.chatName}</span>
                  {isAdmin && (
                    <button onClick={() => setIsEditingName(true)} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer' }}>
                      <Edit3 size={20} />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Members Section */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '1rem' }}>
              Members ({selectedChat.users.length})
            </label>
            
            {isAdmin && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    placeholder="Add member..." 
                    className="input-field" 
                    value={memberSearch}
                    onChange={(e) => handleSearchMembers(e.target.value)}
                  />
                  {searchResults.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', background: 'var(--bg-primary)', borderRadius: '12px', marginTop: '0.5rem', boxShadow: 'var(--shadow-lg)', zIndex: 10, border: '1px solid var(--border-color)', maxHeight: '200px', overflowY: 'auto' }}>
                      {searchResults.map(u => (
                        <div 
                          key={u._id} 
                          onClick={() => handleAddMember(u)}
                          style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                          onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <img src={u.avatar} alt={u.name} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{u.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{u.email}</div>
                          </div>
                          <UserPlus size={18} color="var(--accent-primary)" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {selectedChat.users.map(u => (
                <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'var(--bg-primary)', borderRadius: '12px' }}>
                  <img src={u.avatar} alt={u.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500' }}>
                      {u.name} {u._id === user._id && '(You)'}
                      {u._id === selectedChat.groupAdmin._id && (
                        <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', background: 'rgba(59, 130, 246, 0.2)', color: 'var(--accent-primary)', padding: '2px 8px', borderRadius: '10px' }}>Admin</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{u.about || 'Available'}</div>
                  </div>
                  {isAdmin && u._id !== user._id && (
                    <button onClick={() => handleRemoveMember(u._id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.5rem' }}>
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ padding: '1.5rem', background: 'var(--bg-tertiary)', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '1rem' }}>
          <button 
            onClick={handleLeaveGroup}
            className="btn"
            style={{ flex: 1, background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <LogOut size={20} /> Leave Group
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupSettingsModal;
