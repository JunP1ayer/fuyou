import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Friend as IFriend, FriendSchedule as IFriendSchedule } from '../types/index';

interface FriendState {
  // Data
  friends: IFriend[];
  schedules: Record<string, IFriendSchedule | undefined>; // friendId → schedule
  visibleFriendIds: string[];

  // Friend management
  addFriend: (friend: IFriend) => void;
  removeFriend: (id: string) => void;
  setVisibleFriends: (friendIds: string[]) => void;

  // Schedule management
  importFriendSchedule: (friendId: string, shareCode: string) => boolean;
  getFriendSchedule: (friendId: string) => IFriendSchedule | undefined;

  // Utility
  getVisibleFriends: () => IFriend[];
  getVisibleSchedules: () => IFriendSchedule[];
}

function safeAtob(base64: string): string {
  if (typeof window !== 'undefined' && typeof window.atob === 'function') {
    return window.atob(base64);
  }
  // Fallback: try global atob (some environments polyfill it)
  if (typeof (globalThis as any).atob === 'function') {
    return (globalThis as any).atob(base64);
  }
  throw new Error('Base64 decode is not available in this environment');
}

export const useFriendStore = create<FriendState>()(
  persist(
    (set, get) => ({
      // Initial state
      friends: [],
      schedules: {},
      visibleFriendIds: [],

      // Friend management
      addFriend: (friend: IFriend) => {
        set(state => {
          const exists = state.friends.some(f => f.id === friend.id);
          return exists ? state : { ...state, friends: [...state.friends, friend] };
        });
      },

      removeFriend: (id: string) => {
        set(state => {
          const { [id]: _removed, ...restSchedules } = state.schedules;
          return {
            friends: state.friends.filter(f => f.id !== id),
            schedules: restSchedules,
            visibleFriendIds: state.visibleFriendIds.filter(fid => fid !== id),
          };
        });
      },

      setVisibleFriends: (friendIds: string[]) => {
        const friendIdSet = new Set(get().friends.map(f => f.id));
        const filtered = friendIds.filter(id => friendIdSet.has(id));
        set({ visibleFriendIds: filtered });
      },

      // Schedule management
      importFriendSchedule: (friendId: string, shareCode: string) => {
        try {
          const decoded = safeAtob(shareCode);
          const parsed = JSON.parse(decoded) as { days?: unknown };

          const schedule: IFriendSchedule = {
            friendId,
            days: parsed.days,
          };

          set(state => ({
            schedules: { ...state.schedules, [friendId]: schedule },
          }));

          return true;
        } catch (_err) {
          return false;
        }
      },

      getFriendSchedule: (friendId: string) => {
        return get().schedules[friendId];
      },

      // Utility
      getVisibleFriends: () => {
        const { friends, visibleFriendIds } = get();
        const mapById = new Map(friends.map(f => [f.id, f] as const));
        return visibleFriendIds
          .map(id => mapById.get(id))
          .filter((f): f is IFriend => Boolean(f));
      },

      getVisibleSchedules: () => {
        const { schedules, visibleFriendIds } = get();
        return visibleFriendIds
          .map(id => schedules[id])
          .filter((s): s is IFriendSchedule => s !== undefined);
      },
    }),
    { name: 'friend-store' }
  )
);

export type { IFriend, IFriendSchedule };

export default useFriendStore;
