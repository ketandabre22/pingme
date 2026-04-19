import { create } from 'zustand';

const useChatStore = create((set) => ({
  selectedChat: null,
  chats: [],
  messages: [],
  notifications: [],
  
  showSettings: false,
  setShowSettings: (val) => set({ showSettings: val }),
  activeTab: 'account',
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  socket: null,
  setSocket: (socket) => set({ socket }),
  
  showGroupModal: false,
  setShowGroupModal: (val) => set({ showGroupModal: val }),
  
  showGroupSettings: false,
  setShowGroupSettings: (val) => set({ showGroupSettings: val }),

  // Call states
  call: { isReceivingCall: false, from: null, name: null, avatar: null, signal: null, type: 'video' },
  callAccepted: false,
  callEnded: false,
  stream: null,
  setCall: (call) => set({ call }),
  setCallAccepted: (val) => set({ callAccepted: val }),
  setCallEnded: (val) => set({ callEnded: val }),
  setStream: (stream) => set({ stream }),
  
  setSelectedChat: (chat) => set({ selectedChat: chat, showSettings: false }),
  
  setChats: (chats) => set({ chats }),
  
  setMessages: (messages) => set({ messages }),
  
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),
  
  setNotifications: (notifications) => set({ notifications }),
  
  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications]
  })),
}));

export default useChatStore;
