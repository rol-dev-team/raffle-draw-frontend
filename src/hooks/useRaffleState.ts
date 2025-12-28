// import { useState, useCallback } from 'react';
// import { Prize, DrawResult, DrawHistoryEntry, Category, GroupSize } from '@/types/raffle';

// const DEFAULT_CATEGORIES: Category[] = ['A', 'B', 'C'];

// export function useRaffleState() {
//   const [tickets, setTickets] = useState<string[]>([]);
//   const [prizes, setPrizes] = useState<Prize[]>([]);
//   const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
//   const [currentResults, setCurrentResults] = useState<DrawResult[]>([]);
//   const [history, setHistory] = useState<DrawHistoryEntry[]>([]);
//   const [isDrawing, setIsDrawing] = useState(false);

//   const addTickets = useCallback((newTickets: string[]) => {
//     setTickets(prev => {
//       const existingSet = new Set(prev);
//       const uniqueNew = newTickets.filter(t => !existingSet.has(t));
//       return [...prev, ...uniqueNew];
//     });
//   }, []);

//   const addTicketRange = useCallback((start: number, end: number) => {
//     const rangeTickets: string[] = [];
//     for (let i = start; i <= end; i++) {
//       rangeTickets.push(i.toString());
//     }
//     addTickets(rangeTickets);
//   }, [addTickets]);

//   const removeTickets = useCallback((ticketsToRemove: string[]) => {
//     setTickets(prev => prev.filter(t => !ticketsToRemove.includes(t)));
//   }, []);

//   const clearTickets = useCallback(() => {
//     setTickets([]);
//   }, []);

//   // Category management
//   const addCategory = useCallback((name: string) => {
//     const trimmed = name.trim().toUpperCase();
//     if (trimmed && !categories.includes(trimmed)) {
//       setCategories(prev => [...prev, trimmed]);
//       return true;
//     }
//     return false;
//   }, [categories]);

//   const deleteCategory = useCallback((name: string) => {
//     // Only allow deletion if no prizes exist in this category
//     const hasPrizes = prizes.some(p => p.category === name);
//     if (!hasPrizes) {
//       setCategories(prev => prev.filter(c => c !== name));
//       return true;
//     }
//     return false;
//   }, [prizes]);

//   const addPrize = useCallback((name: string, category: Category) => {
//     const newPrize: Prize = {
//       id: crypto.randomUUID(),
//       name,
//       category,
//       isAssigned: false,
//     };
//     setPrizes(prev => [...prev, newPrize]);
//   }, []);

//   const addBulkPrizes = useCallback((prizesData: Array<{ name: string; category: Category }>) => {
//     const newPrizes: Prize[] = prizesData.map(p => ({
//       id: crypto.randomUUID(),
//       name: p.name,
//       category: p.category,
//       isAssigned: false,
//     }));
//     setPrizes(prev => [...prev, ...newPrizes]);
//     return newPrizes.length;
//   }, []);

//   const updatePrize = useCallback((id: string, name: string, category: Category) => {
//     setPrizes(prev => prev.map(p => 
//       p.id === id ? { ...p, name, category } : p
//     ));
//   }, []);

//   const deletePrize = useCallback((id: string) => {
//     setPrizes(prev => prev.filter(p => p.id !== id));
//   }, []);

//   const getAvailablePrizes = useCallback((category: Category) => {
//     return prizes.filter(p => p.category === category && !p.isAssigned);
//   }, [prizes]);

//   const getPrizesByCategory = useCallback((category: Category) => {
//     return prizes.filter(p => p.category === category);
//   }, [prizes]);

//   const executeDraw = useCallback(async (
//     category: Category,
//     groupSize: GroupSize,
//     onAnimationTick?: (shuffledTickets: string[]) => void
//   ): Promise<DrawResult[]> => {
//     const availablePrizes = getAvailablePrizes(category);
    
//     if (tickets.length < groupSize || availablePrizes.length < groupSize) {
//       return [];
//     }

//     setIsDrawing(true);

//     // Animation phase - shuffle display for 2.5 seconds
//     const animationDuration = 2500;
//     const tickInterval = 80;
//     const ticks = animationDuration / tickInterval;

//     for (let i = 0; i < ticks; i++) {
//       await new Promise(resolve => setTimeout(resolve, tickInterval));
//       if (onAnimationTick) {
//         // Generate random tickets for display during animation
//         const shuffled = [...tickets]
//           .sort(() => Math.random() - 0.5)
//           .slice(0, groupSize);
//         onAnimationTick(shuffled);
//       }
//     }

//     // Actual random selection using crypto
//     const selectedTickets: string[] = [];
//     const ticketPool = [...tickets];
    
//     for (let i = 0; i < groupSize; i++) {
//       const randomArray = new Uint32Array(1);
//       crypto.getRandomValues(randomArray);
//       const randomIndex = randomArray[0] % ticketPool.length;
//       selectedTickets.push(ticketPool[randomIndex]);
//       ticketPool.splice(randomIndex, 1);
//     }

//     // Assign prizes
//     const results: DrawResult[] = selectedTickets.map((ticket, index) => {
//       const prize = availablePrizes[index];
//       return {
//         id: crypto.randomUUID(),
//         ticketNumber: ticket,
//         prize: { ...prize, isAssigned: true, assignedTo: ticket },
//         category,
//         timestamp: new Date(),
//       };
//     });

//     // Update state
//     removeTickets(selectedTickets);
//     setPrizes(prev => prev.map(p => {
//       const assigned = results.find(r => r.prize.id === p.id);
//       if (assigned) {
//         return { ...p, isAssigned: true, assignedTo: assigned.ticketNumber };
//       }
//       return p;
//     }));

//     const historyEntry: DrawHistoryEntry = {
//       id: crypto.randomUUID(),
//       results,
//       category,
//       groupSize,
//       timestamp: new Date(),
//     };

//     setCurrentResults(results);
//     setHistory(prev => [historyEntry, ...prev]);
//     setIsDrawing(false);

//     return results;
//   }, [tickets, getAvailablePrizes, removeTickets]);

//   const resetAll = useCallback(() => {
//     setTickets([]);
//     setPrizes([]);
//     setCategories([...DEFAULT_CATEGORIES]);
//     setCurrentResults([]);
//     setHistory([]);
//     setIsDrawing(false);
//   }, []);

//   const clearCurrentResults = useCallback(() => {
//     setCurrentResults([]);
//   }, []);

//   return {
//     tickets,
//     prizes,
//     categories,
//     currentResults,
//     history,
//     isDrawing,
//     addTickets,
//     addTicketRange,
//     removeTickets,
//     clearTickets,
//     addCategory,
//     deleteCategory,
//     addPrize,
//     addBulkPrizes,
//     updatePrize,
//     deletePrize,
//     getAvailablePrizes,
//     getPrizesByCategory,
//     executeDraw,
//     resetAll,
//     clearCurrentResults,
//   };
// }


import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  Prize,
  DrawResult,
  DrawHistoryEntry,
  Category,
  GroupSize,
  TicketOwner,
} from '@/types/raffle';

const DEFAULT_CATEGORIES: Category[] = ['A', 'B', 'C'];

interface RaffleState {
  // ------------------- STATE -------------------
  tickets: string[];
  prizes: Prize[];
  categories: Category[];
  owners: TicketOwner[];
  currentResults: DrawResult[];
  history: DrawHistoryEntry[];
  isDrawing: boolean;

  // ------------------- OWNERS -------------------
  addOwner: (name: string, ticketNumbers: string[]) => TicketOwner;
  updateOwner: (id: string, name: string, ticketNumbers: string[]) => void;
  deleteOwner: (id: string) => void;
  addBulkOwners: (data: { name: string; ticketNumbers: string[] }[]) => number;
  resetOwners: () => void;
  getOwnerByTicket: (ticket: string) => TicketOwner | undefined;
  getAllTicketsFromOwners: () => string[];

  // ------------------- TICKETS -------------------
  addTickets: (tickets: string[]) => void;
  addTicketRange: (start: number, end: number) => void;
  removeTickets: (ticketsToRemove: string[]) => void;
  clearTickets: () => void;

  // ------------------- CATEGORIES -------------------
  addCategory: (name: string) => boolean;
  deleteCategory: (name: string) => boolean;

  // ------------------- PRIZES -------------------
  addPrize: (name: string, category: Category) => void;
  addBulkPrizes: (data: { name: string; category: Category }[]) => number;
  updatePrize: (id: string, name: string, category: Category) => void;
  deletePrize: (id: string) => void;
  getAvailablePrizes: (category: Category) => Prize[];
  getPrizesByCategory: (category: Category) => Prize[];

  // ------------------- DRAW -------------------
  executeDraw: (
    category: Category,
    groupSize: GroupSize,
    onAnimationTick?: (tickets: string[]) => void
  ) => Promise<DrawResult[]>;

  clearCurrentResults: () => void;

  // ------------------- RESET -------------------
  resetAll: () => void;
}

export const useRaffleState = create<RaffleState>()(
  persist(
    (set, get) => ({
      // ------------------- INITIAL STATE -------------------
      tickets: [],
      prizes: [],
      categories: DEFAULT_CATEGORIES,
      owners: [],
      currentResults: [],
      history: [],
      isDrawing: false,

      // ------------------- OWNERS -------------------
      addOwner: (name, ticketNumbers) => {
        const owner: TicketOwner = {
          id: crypto.randomUUID(),
          name,
          ticketNumbers,
        };
        set(state => ({ owners: [...state.owners, owner] }));
        return owner;
      },

      updateOwner: (id, name, ticketNumbers) =>
        set(state => ({
          owners: state.owners.map(o =>
            o.id === id ? { ...o, name, ticketNumbers } : o
          ),
        })),

      deleteOwner: id =>
        set(state => ({
          owners: state.owners.filter(o => o.id !== id),
        })),

      addBulkOwners: data => {
        const newOwners: TicketOwner[] = data.map(d => ({
          id: crypto.randomUUID(),
          name: d.name,
          ticketNumbers: d.ticketNumbers,
        }));
        set(state => ({ owners: [...state.owners, ...newOwners] }));
        return newOwners.length;
      },

      resetOwners: () => set({ owners: [] }),

      getOwnerByTicket: ticket =>
        get().owners.find(o => o.ticketNumbers.includes(ticket)),

      getAllTicketsFromOwners: () =>
        Array.from(new Set(get().owners.flatMap(o => o.ticketNumbers))),

      // ------------------- TICKETS -------------------
      addTickets: newTickets =>
        set(state => ({
          tickets: [...new Set([...state.tickets, ...newTickets])],
        })),

      addTicketRange: (start, end) => {
        const range = Array.from(
          { length: end - start + 1 },
          (_, i) => (start + i).toString()
        );
        get().addTickets(range);
      },

      removeTickets: ticketsToRemove =>
        set(state => ({
          tickets: state.tickets.filter(t => !ticketsToRemove.includes(t)),
        })),

      clearTickets: () => set({ tickets: [] }),

      // ------------------- CATEGORIES -------------------
      addCategory: name => {
        const trimmed = name.trim().toUpperCase();
        if (!trimmed || get().categories.includes(trimmed)) return false;
        set(state => ({ categories: [...state.categories, trimmed] }));
        return true;
      },

      deleteCategory: name => {
        const hasPrizes = get().prizes.some(p => p.category === name);
        if (hasPrizes) return false;
        set(state => ({
          categories: state.categories.filter(c => c !== name),
        }));
        return true;
      },

      // ------------------- PRIZES -------------------
      addPrize: (name, category) => {
        const prize: Prize = {
          id: crypto.randomUUID(),
          name,
          category,
          isAssigned: false,
        };
        set(state => ({ prizes: [...state.prizes, prize] }));
      },

      addBulkPrizes: data => {
        const newPrizes: Prize[] = data.map(p => ({
          id: crypto.randomUUID(),
          name: p.name,
          category: p.category,
          isAssigned: false,
        }));
        set(state => ({ prizes: [...state.prizes, ...newPrizes] }));
        return newPrizes.length;
      },

      updatePrize: (id, name, category) =>
        set(state => ({
          prizes: state.prizes.map(p =>
            p.id === id ? { ...p, name, category } : p
          ),
        })),

      deletePrize: id =>
        set(state => ({
          prizes: state.prizes.filter(p => p.id !== id),
        })),

      getAvailablePrizes: category =>
        get().prizes.filter(p => p.category === category && !p.isAssigned),

      getPrizesByCategory: category =>
        get().prizes.filter(p => p.category === category),

      // ------------------- DRAW -------------------
      executeDraw: async (category, groupSize, onAnimationTick) => {
        const { tickets, prizes } = get();
        const availablePrizes = prizes.filter(
          p => p.category === category && !p.isAssigned
        );

        if (tickets.length < groupSize || availablePrizes.length < groupSize) {
          return [];
        }

        set({ isDrawing: true });

        // Animation phase
        const animationDuration = 2500;
        const tickInterval = 80;
        const ticks = animationDuration / tickInterval;

        for (let i = 0; i < ticks; i++) {
          await new Promise(res => setTimeout(res, tickInterval));
          if (onAnimationTick) {
            const shuffled = [...tickets]
              .sort(() => Math.random() - 0.5)
              .slice(0, groupSize);
            onAnimationTick(shuffled);
          }
        }

        // Secure random draw
        const ticketPool = [...tickets];
        const selected: string[] = [];

        for (let i = 0; i < groupSize; i++) {
          const rand = new Uint32Array(1);
          crypto.getRandomValues(rand);
          const index = rand[0] % ticketPool.length;
          selected.push(ticketPool[index]);
          ticketPool.splice(index, 1);
        }

        const results: DrawResult[] = selected.map((ticket, i) => ({
          id: crypto.randomUUID(),
          ticketNumber: ticket,
          prize: {
            ...availablePrizes[i],
            isAssigned: true,
            assignedTo: ticket,
          },
          category,
          timestamp: new Date(),
        }));

        set(state => ({
          tickets: state.tickets.filter(t => !selected.includes(t)),
          prizes: state.prizes.map(p => {
            const match = results.find(r => r.prize.id === p.id);
            return match
              ? { ...p, isAssigned: true, assignedTo: match.ticketNumber }
              : p;
          }),
          currentResults: results,
          history: [
            {
              id: crypto.randomUUID(),
              results,
              category,
              groupSize,
              timestamp: new Date(),
            },
            ...state.history,
          ],
          isDrawing: false,
        }));

        return results;
      },

      clearCurrentResults: () => set({ currentResults: [] }),

      // ------------------- RESET -------------------
      resetAll: () =>
        set({
          tickets: [],
          prizes: [],
          owners: [],
          categories: DEFAULT_CATEGORIES,
          currentResults: [],
          history: [],
          isDrawing: false,
        }),
    }),
    {
      name: 'raffle-store',
      storage: createJSONStorage(() => localStorage),

      partialize: state => ({
        tickets: state.tickets,
        prizes: state.prizes,
        owners: state.owners,
        categories: state.categories,
        history: state.history,
      }),

      onRehydrateStorage: () => state => {
        if (!state) return;
        state.history = state.history.map(h => ({
          ...h,
          timestamp: new Date(h.timestamp),
          results: h.results.map(r => ({
            ...r,
            timestamp: new Date(r.timestamp),
          })),
        }));
      },
    }
  )
);