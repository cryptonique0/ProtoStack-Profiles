import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface UIState {
  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Search
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;

  // Notifications
  notificationsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;
  unreadCount: number;
  setUnreadCount: (count: number) => void;

  // Modals
  activeModal: string | null;
  modalData: Record<string, unknown>;
  openModal: (modal: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;

  // Toast notifications from actions
  pendingToasts: Array<{
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
  }>;
  addToast: (toast: Omit<UIState['pendingToasts'][0], 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Theme
      theme: 'system',
      setTheme: (theme) => set({ theme }),

      // Sidebar
      sidebarOpen: true,
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      // Search
      searchOpen: false,
      setSearchOpen: (searchOpen) => set({ searchOpen }),

      // Notifications
      notificationsOpen: false,
      setNotificationsOpen: (notificationsOpen) => set({ notificationsOpen }),
      unreadCount: 0,
      setUnreadCount: (unreadCount) => set({ unreadCount }),

      // Modals
      activeModal: null,
      modalData: {},
      openModal: (modal, data = {}) => set({ activeModal: modal, modalData: data }),
      closeModal: () => set({ activeModal: null, modalData: {} }),

      // Toasts
      pendingToasts: [],
      addToast: (toast) =>
        set((state) => ({
          pendingToasts: [
            ...state.pendingToasts,
            { ...toast, id: crypto.randomUUID() },
          ],
        })),
      removeToast: (id) =>
        set((state) => ({
          pendingToasts: state.pendingToasts.filter((t) => t.id !== id),
        })),
    }),
    {
      name: 'protostack-ui',
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
