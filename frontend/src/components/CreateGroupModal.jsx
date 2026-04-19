import { useState } from 'react';
import { X } from 'lucide-react';
import axios from '../utils/axiosConfig';
import useAuthStore from '../store/authStore';
import useChatStore from '../store/chatStore';

const CreateGroupModal = () => {
  const { user } = useAuthStore();
  const { 
    chats, 
    setChats, 
    setSelectedChat, 
    showGroupModal, 
    setShowGroupModal 
  } = useChatStore();

  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupSearch, setGroupSearch] = useState('');
  const [groupSearchResults, setGroupSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  if (!showGroupModal) return null;

  const handleGroupSearch = async (query) => {
    setGroupSearch(query);
    if (!query) {
      setGroupSearchResults([]);
      return;
    }
    try {
      const { data } = await axios.get(`/api/users?search=${query}`);
      // Filter out self and already selected users
      const filtered = data.filter(u => u._id !== user._id && !selectedUsers.find(su => su._id === u._id));
      setGroupSearchResults(filtered);
    } catch (error) {
      console.error('Group search error:', error);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName) {
      alert("Please enter a group name");
      return;
    }
    if (selectedUsers.length < 1) {
      alert("Please add at least one member to the group");
      return;
    }

    try {
      setLoading(true);
      const { data } = await axios.post('/api/chats/group', {
        name: groupName,
        users: JSON.stringify(selectedUsers.map(u => u._id))
      });
      
      setChats([data, ...chats]);
      setSelectedChat(data);
      setShowGroupModal(false);
      setGroupName('');
      setSelectedUsers([]);
      setGroupSearch('');
    } catch (error) {
      console.error('Error creating group:', error.response?.data || error);
      alert(error.response?.data?.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
      <div className="animate-fade-in" style={{ width: '90%', maxWidth: '450px', background: 'var(--bg-secondary)', borderRadius: '24px', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>New Group</h3>
          <div onClick={() => setShowGroupModal(false)} style={{ cursor: 'pointer', padding: '4px', borderRadius: '50%', background: 'var(--bg-tertiary)' }}><X size={20} /></div>
        </div>
        
        <div className="input-group">
          <label>Group Name</label>
          <input 
            type="text" 
            placeholder="Enter group name" 
            className="input-field" 
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
        </div>

        <div className="input-group" style={{ marginBottom: '0.5rem' }}>
          <label>Add Members</label>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Search users..." 
              className="input-field" 
              value={groupSearch}
              onChange={(e) => handleGroupSearch(e.target.value)}
            />
            {groupSearchResults.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', maxHeight: '200px', overflowY: 'auto', background: 'var(--bg-primary)', borderRadius: '12px', marginTop: '0.5rem', boxShadow: 'var(--shadow-lg)', zIndex: 110, border: '1px solid var(--border-color)' }}>
                {groupSearchResults.map(u => (
                  <div 
                    key={u._id} 
                    onClick={() => {
                      if (!selectedUsers.find(su => su._id === u._id)) setSelectedUsers([...selectedUsers, u]);
                      setGroupSearch('');
                      setGroupSearchResults([]);
                    }}
                    style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <img src={u.avatar} alt={u.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div>
                      <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{u.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{u.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem', minHeight: '32px' }}>
          {selectedUsers.map(u => (
            <div key={u._id} style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary)', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <img src={u.avatar} style={{ width: '18px', height: '18px', borderRadius: '50%' }} />
              {u.name} 
              <X size={14} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setSelectedUsers(selectedUsers.filter(su => su._id !== u._id))} />
            </div>
          ))}
        </div>

        <button 
          className="btn btn-primary" 
          style={{ width: '100%', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          disabled={loading || !groupName || selectedUsers.length < 1}
          onClick={handleCreateGroup}
        >
          {loading ? 'Creating...' : 'Create Group'}
        </button>
      </div>
    </div>
  );
};

export default CreateGroupModal;
