import { create } from 'zustand';

const userInfoFromStorage = localStorage.getItem('userInfo')
  ? JSON.parse(localStorage.getItem('userInfo'))
  : null;

const useAuthStore = create((set) => ({
  user: userInfoFromStorage,
  
  login: (userData) => {
    localStorage.setItem('userInfo', JSON.stringify(userData));
    set({ user: userData });
  },
  
  updateSettings: (newUserData) => {
    const updatedUser = { ...useAuthStore.getState().user, ...newUserData };
    localStorage.setItem('userInfo', JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },
  
  logout: () => {
    localStorage.removeItem('userInfo');
    set({ user: null });
  },
}));

export default useAuthStore;
