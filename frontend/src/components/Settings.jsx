import { useState, useRef } from 'react';
import { Settings as SettingsIcon, User, Star, Shield, Bell, HelpCircle, X, Check, ArrowLeft } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useChatStore from '../store/chatStore';
import axios from '../utils/axiosConfig';

const Settings = () => {
  const { user, updateSettings } = useAuthStore();
  const { setShowSettings, activeTab, setActiveTab } = useChatStore();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showSupportForm, setShowSupportForm] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [activeFaq, setActiveFaq] = useState(null);

  // Form states for Account
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [about, setAbout] = useState(user.about || 'Hey there! I am using PingMe.');
  const [avatarPreview, setAvatarPreview] = useState(user.avatar);
  const fileInputRef = useRef(null);
  
  // Preferences states
  const [preferences, setPreferences] = useState(user.preferences || {
    notifications: true,
    showLastSeen: true,
    readReceipts: true,
    theme: 'dark'
  });

  const handleSaveAccount = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const { data } = await axios.put('/api/users/settings', { 
        name, 
        email, 
        about,
        avatar: avatarPreview,
        preferences 
      });
      updateSettings(data);
      setMessage({ type: 'success', text: 'Settings updated successfully!' });
    } catch (error) {
      console.error('Failed to update settings', error);
      const errorMsg = error.response?.data?.message || 'Failed to update settings';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
    }
  };

  const handleTogglePreference = async (key) => {
    const updatedPreferences = { ...preferences, [key]: !preferences[key] };
    setPreferences(updatedPreferences);
    
    // Auto-save preference toggles
    try {
      const { data } = await axios.put('/api/users/settings', { preferences: updatedPreferences });
      updateSettings(data);
    } catch (error) {
      console.error('Failed to update preference');
    }
  };

  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/users/support', {
        name: user.name,
        email: user.email,
        message: supportMessage
      });
      setMessage({ type: 'success', text: 'Support request sent successfully! We will get back to you soon.' });
      setSupportMessage('');
      setShowSupportForm(false);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send support request. Please try again later.' });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'account', icon: User, label: 'Account' },
    { id: 'favorites', icon: Star, label: 'Favorites' },
    { id: 'privacy', icon: Shield, label: 'Privacy' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'help', icon: HelpCircle, label: 'Help' },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', height: '100%' }}>
      {/* Detail Header */}
      <div style={{ height: 'var(--header-height)', padding: '0 1.5rem', display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: '600', textTransform: 'capitalize' }}>{activeTab} Settings</h3>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Settings Content Area */}
        <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          {activeTab === 'account' && (
            <div className="animate-fade-in">
              <h3 style={{ fontSize: '1.5rem', marginBottom: '2rem', color: 'var(--text-primary)' }}>Account Information</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                <img src={avatarPreview} alt="Profile" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} />
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  onChange={handleAvatarChange}
                />
                <button 
                  className="btn" 
                  onClick={() => fileInputRef.current.click()}
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                >
                  Upload Photo
                </button>
              </div>
              
              {message.text && (
                <div style={{ 
                  padding: '0.75rem 1rem', 
                  borderRadius: '8px', 
                  marginBottom: '1.5rem',
                  background: message.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: message.type === 'success' ? '#4ade80' : '#f87171',
                  border: `1px solid ${message.type === 'success' ? '#22c55e' : '#ef4444'}`,
                  fontSize: '0.9rem'
                }}>
                  {message.text}
                </div>
              )}

              <div className="input-group">
                <label>Name</label>
                <input type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Email</label>
                <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="input-group">
                <label>About</label>
                <input type="text" className="input-field" value={about} onChange={(e) => setAbout(e.target.value)} placeholder="Hey there! I am using PingMe." />
              </div>
              <button className="btn btn-primary" onClick={handleSaveAccount} disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="animate-fade-in">
              <h3 style={{ fontSize: '1.5rem', marginBottom: '2rem', color: 'var(--text-primary)' }}>Appearance</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Choose your favorite theme and customize your experience.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1.5rem' }}>
                {[
                  { id: 'default', name: 'PingMe Blue', color: '#3b82f6', class: '' },
                  { id: 'emerald', name: 'Emerald Green', color: '#10b981', class: 'theme-emerald' },
                  { id: 'ocean', name: 'Ocean Teal', color: '#06b6d4', class: 'theme-ocean' },
                  { id: 'sunset', name: 'Sunset Rose', color: '#f43f5e', class: 'theme-sunset' },
                  { id: 'midnight', name: 'Midnight Purple', color: '#8b5cf6', class: 'theme-midnight' },
                  { id: 'royal', name: 'Royal Amber', color: '#f59e0b', class: 'theme-royal' }
                ].map((theme) => (
                  <div 
                    key={theme.id}
                    onClick={() => {
                      document.body.className = theme.class;
                      localStorage.setItem('pingme-theme', theme.class);
                      setMessage({ type: 'success', text: `Theme changed to ${theme.name}` });
                    }}
                    style={{ 
                      background: 'var(--bg-secondary)', 
                      borderRadius: '16px', 
                      padding: '1rem', 
                      cursor: 'pointer',
                      border: document.body.className === theme.class ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                      textAlign: 'center',
                      transition: 'var(--transition)'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: theme.color, margin: '0 auto 1rem', boxShadow: `0 4px 12px ${theme.color}44` }} />
                    <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{theme.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="animate-fade-in">
              <h3 style={{ fontSize: '1.5rem', marginBottom: '2rem', color: 'var(--text-primary)' }}>Favorite Contacts</h3>
              {(!user.favorites || user.favorites.length === 0) ? (
                <p style={{ color: 'var(--text-secondary)' }}>You haven't added any favorites yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {user.favorites.map((fav) => (
                    <div key={typeof fav === 'object' ? fav._id : fav} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-primary)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                         {fav.avatar ? (
                           <img src={fav.avatar} alt={fav.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                         ) : (
                           <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                             <User size={20} />
                           </div>
                         )}
                         <span style={{ fontWeight: '500' }}>{fav.name || 'Favorite User'}</span>
                      </div>
                      <Star size={20} fill="var(--warning)" color="var(--warning)" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="animate-fade-in">
              <h3 style={{ fontSize: '1.5rem', marginBottom: '2rem', color: 'var(--text-primary)' }}>Privacy Settings</h3>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', background: 'var(--bg-primary)', borderRadius: '12px', marginBottom: '1rem' }}>
                <div>
                  <h4 style={{ fontWeight: '500', marginBottom: '0.25rem' }}>Show Last Seen</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Let others see exactly when you were last online.</p>
                </div>
                <div onClick={() => handleTogglePreference('showLastSeen')} style={{ width: '44px', height: '24px', background: preferences.showLastSeen ? 'var(--accent-primary)' : 'var(--bg-tertiary)', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'var(--transition)' }}>
                  <div style={{ width: '20px', height: '20px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: preferences.showLastSeen ? '22px' : '2px', transition: 'var(--transition)' }} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', background: 'var(--bg-primary)', borderRadius: '12px' }}>
                <div>
                  <h4 style={{ fontWeight: '500', marginBottom: '0.25rem' }}>Read Receipts</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Let others know when you have read their messages.</p>
                </div>
                <div onClick={() => handleTogglePreference('readReceipts')} style={{ width: '44px', height: '24px', background: preferences.readReceipts ? 'var(--accent-primary)' : 'var(--bg-tertiary)', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'var(--transition)' }}>
                  <div style={{ width: '20px', height: '20px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: preferences.readReceipts ? '22px' : '2px', transition: 'var(--transition)' }} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="animate-fade-in">
              <h3 style={{ fontSize: '1.5rem', marginBottom: '2rem', color: 'var(--text-primary)' }}>Notifications</h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', background: 'var(--bg-primary)', borderRadius: '12px' }}>
                <div>
                  <h4 style={{ fontWeight: '500', marginBottom: '0.25rem' }}>Push Notifications</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Receive alerts for new messages when the app is backgrounded.</p>
                </div>
                <div onClick={() => handleTogglePreference('notifications')} style={{ width: '44px', height: '24px', background: preferences.notifications ? 'var(--accent-primary)' : 'var(--bg-tertiary)', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'var(--transition)' }}>
                  <div style={{ width: '20px', height: '20px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: preferences.notifications ? '22px' : '2px', transition: 'var(--transition)' }} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'help' && (
            <div className="animate-fade-in">
              <h3 style={{ fontSize: '1.5rem', marginBottom: '2rem', color: 'var(--text-primary)' }}>Help & Support</h3>
              
              {!showSupportForm ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* FAQs Section */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <h4 style={{ fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Frequently Asked Questions</h4>
                    
                    {[
                      { q: "How do I change my profile photo?", a: "Go to the 'Account' tab in Settings, click 'Upload Photo', select your image, and click 'Save Changes'." },
                      { q: "How do I add someone to Favorites?", a: "Open a chat with the person and click the Star icon in the top right corner of the chat window." },
                      { q: "Is my data secure?", a: "Yes, PingMe uses industry-standard encryption and secure JWT authentication to protect your messages and account data." },
                      { q: "Can I use PingMe on mobile?", a: "PingMe is fully responsive and works great on mobile browsers, though we are working on a dedicated app!" }
                    ].map((faq, index) => (
                      <div key={index} style={{ background: 'var(--bg-primary)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                        <div 
                          onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                          style={{ padding: '1rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: activeFaq === index ? 'var(--bg-tertiary)' : 'transparent' }}
                        >
                          <span style={{ fontWeight: '500', fontSize: '0.95rem' }}>{faq.q}</span>
                          <span style={{ transform: activeFaq === index ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'var(--transition)' }}>▼</span>
                        </div>
                        {activeFaq === index && (
                          <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                            {faq.a}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Contact Info Section */}
                  <div style={{ background: 'var(--bg-primary)', padding: '2rem', borderRadius: '12px', textAlign: 'center' }}>
                    <Shield size={48} color="var(--accent-primary)" style={{ marginBottom: '1rem' }} />
                    <h4 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>PingMe v1.0.0</h4>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>A scalable, real-time messaging platform.</p>
                    <button 
                      onClick={() => setShowSupportForm(true)}
                      className="btn btn-primary"
                      style={{ padding: '0.75rem 2rem' }}
                    >
                      Contact Support
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <button 
                      onClick={() => setShowSupportForm(false)} 
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <h4 style={{ fontWeight: '600' }}>Contact Support</h4>
                  </div>

                  <form onSubmit={handleSupportSubmit}>
                    <div className="input-group">
                      <label>Your Name</label>
                      <input type="text" className="input-field" value={user.name} disabled style={{ opacity: 0.7 }} />
                    </div>
                    <div className="input-group">
                      <label>Your Email</label>
                      <input type="text" className="input-field" value={user.email} disabled style={{ opacity: 0.7 }} />
                    </div>
                    <div className="input-group">
                      <label>Describe your problem or feedback</label>
                      <textarea 
                        className="input-field" 
                        rows="5" 
                        required
                        placeholder="Type here..."
                        value={supportMessage}
                        onChange={(e) => setSupportMessage(e.target.value)}
                        style={{ resize: 'none', paddingTop: '0.75rem' }}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                      {loading ? 'Sending...' : 'Send Message'}
                    </button>
                  </form>
                </div>
              )}

              {message.text && (
                <div style={{ 
                  marginTop: '1.5rem',
                  padding: '0.75rem 1rem', 
                  borderRadius: '8px', 
                  background: message.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: message.type === 'success' ? '#4ade80' : '#f87171',
                  border: `1px solid ${message.type === 'success' ? '#22c55e' : '#ef4444'}`,
                  fontSize: '0.9rem'
                }}>
                  {message.text}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
