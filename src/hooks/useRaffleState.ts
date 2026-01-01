import { useState, useCallback, useEffect } from 'react';
import { Prize, DrawResult, DrawHistoryEntry, Category, GroupSize, CategoryFromApi, PrizeFromApi } from '@/types/raffle';
import { getCategories, createCategory as apiCreateCategory, deleteCategory as apiDeleteCategory, importCategoriesCsv as apiCsvCategory } from './../services/categoryApi';
import { getPrizes, createPrize as apiCreatePrize, updatePrize as apiUpdatePrize, deletePrize as apiDeletePrize, importPrizesCsv as apiImportPrizesCsv } from './../services/prizeApi';
import { getDrawTicket, createDrawTicket as apiDrawTicket, updateDrawTicket as apiUpdateDrawTicket, deleteDrawTicket as apiDeleteDrawTicket, importDrawTicketsCsv as apiDrawTicketCSV }  from './../services/drawTicketApi';
import { getDrawHistories } from '@/services/drawHistoryApi';

import { createDrawHistory } from '@/services/drawHistoryApi';
const arrayToCsvFile = (prizes: Array<{ name: string; category: string }>): File => {
  // Header must match backend: Category,Prize
  const csvRows = ['Category,Prize'];

  prizes.forEach(p => {
    // Escape commas in names if needed
    const category = `"${p.category.replace(/"/g, '""')}"`;
    const name = `"${p.name.replace(/"/g, '""')}"`;
    csvRows.push(`${category},${name}`);
  });

  const csvString = csvRows.join('\n');
  return new File([csvString], 'prizes.csv', { type: 'text/csv' });
};



export function useRaffleState() {
  const [tickets, setTickets] = useState<{ id: number; ticket_number: string }[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryMap, setCategoryMap] = useState<Map<string, number>>(new Map()); // name -> id
  const [currentResults, setCurrentResults] = useState<DrawResult[]>([]);
  const [history, setHistory] = useState<DrawHistoryEntry[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch categories from API
  const fetchCategories = useCallback(async () => {
    try {
      const res = await getCategories();
      const apiCategories = res.data.data || [];
      const names = apiCategories.map(c => c.name.toUpperCase());

      const map = new Map<string, number>();
      apiCategories.forEach(c => map.set(c.name.toUpperCase(), c.id));

      setCategories(names);
      setCategoryMap(map);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  }, []);
//fetch tickets from API
  const fetchTickets = useCallback(async () => {
  try {
    const res = await getDrawTicket(); // GET /draw-tickets
    setTickets(res.data.data || []);
  } catch (err) {
    console.error('Failed to fetch tickets:', err);
  }
}, []);


  // Fetch prizes from API
  const fetchPrizes = useCallback(async () => {
  try {
    const prizesRes = await getPrizes();
    const apiPrizes = prizesRes.data.data || [];

    const mappedPrizes: Prize[] = apiPrizes
      .map(p => {
        const categoryName = Array.from(categoryMap.entries())
          .find(([, id]) => id === p.category_id)?.[0];

        if (!categoryName) {
          console.warn('Prize skipped (category missing):', p);
          return null;
        }

        return {
          id: p.id.toString(),
          name: p.name,
          category: categoryName,
          isAssigned: p.is_drawn,
          apiId: p.id,
          categoryId: p.category_id,
        };
      })
      .filter(Boolean) as Prize[];

    setPrizes(mappedPrizes);
  } catch (err) {
    console.error('Failed to fetch prizes:', err);
  }
}, [categoryMap]);

// Fetch draw history from backend
const fetchHistory = useCallback(async () => {
  try {
    const res = await getDrawHistories();
    const apiHistory = res.data.data || [];

    const mappedHistory: DrawHistoryEntry[] = apiHistory
      .map((entry: any) => {
        // 🔴 Handle different backend shapes safely
        const rawResults =
          entry.results ??
          entry.draw_results ??
          entry.items ??
          [];

        if (!Array.isArray(rawResults) || rawResults.length === 0) {
          return null;
        }

        const results: DrawResult[] = rawResults.map((r: any) => {
  const category = r.category ?? entry.category;

  return {
    id: r.id ?? crypto.randomUUID(),
    ticketNumber: r.ticketNumber ?? r.ticket_number,
    prize: {
      id: r.prize?.id ?? crypto.randomUUID(),
      name: r.prize?.name ?? '',
      category,               // ✅ REQUIRED
      isAssigned: true,
      assignedTo: r.prize?.assignedTo ?? r.ticketNumber,
    },
    category,
    timestamp: new Date(r.timestamp ?? entry.created_at),
  };
});


        return {
          id: entry.id?.toString() ?? crypto.randomUUID(),
          category: results[0].category,
          groupSize: results.length,
          timestamp: new Date(entry.created_at ?? entry.timestamp),
          results,
        };
      })
      .filter(Boolean) as DrawHistoryEntry[];

    setHistory(mappedHistory.reverse());
  } catch (err) {
    console.error('Failed to fetch draw history:', err);
  }
}, []);




  // Initial fetch
 useEffect(() => {
  const init = async () => {
    setIsLoading(true);
    await fetchCategories();
    await fetchTickets();
    setIsLoading(false);
  };

  init();
}, [fetchCategories, fetchTickets]);
useEffect(() => {
  if (categoryMap.size > 0) {
    fetchPrizes();
    fetchHistory();
  }
}, [categoryMap, fetchPrizes, fetchHistory]);


// Add a second effect that reacts when the map is actually populated
useEffect(() => {
  if (categoryMap.size > 0) {
    fetchPrizes();
  }
}, [categoryMap, fetchPrizes]);


  const addTickets = useCallback(async (newTickets: string[]) => {
  for (const ticket of newTickets) {
    try {
      await apiDrawTicket({ ticket_number: ticket });
    } catch (err) {
      // Ignore duplicates (unique constraint)
      console.warn('Ticket skipped:', ticket);
    }
  }
  await fetchTickets(); // refresh from backend
}, [fetchTickets]);


  const addTicketRange = useCallback((start: number, end: number) => {
  const rangeTickets = [];
  for (let i = start; i <= end; i++) {
    rangeTickets.push(i.toString());
  }
  addTickets(rangeTickets);
}, [addTickets]);

  const removeTickets = useCallback((ticketsToRemove: string[]) => {
  setTickets(prev => prev.filter(t => !ticketsToRemove.includes(t.ticket_number)));
}, []);

  const clearTickets = useCallback(() => {
  setTickets([]);
}, []);
const importTicketsCsv = useCallback(async (file: File) => {
  try {
    const formData = new FormData();
    formData.append('csv', file);
    const res = await apiDrawTicketCSV(formData); // POST /draw-tickets/import
    const importedTickets = res.data.data.map((t: any) => ({
      id: t.id,
      ticket_number: t.ticket_number
    }));
    setTickets(prev => [...prev, ...importedTickets]);
  } catch (err) {
    console.error('Failed to import tickets CSV:', err);
  }
}, []);

  // Category management
  const addCategoryAsync = useCallback(async (name: string) => {
    const trimmed = name.trim().toUpperCase();
    if (trimmed && !categories.includes(trimmed)) {
      try {
        const res = await apiCreateCategory({ name: trimmed });
        if (res.data.status) {
          await fetchCategories();
          await fetchPrizes();
          return true;
        }
      } catch (err) {
        console.error('Failed to create category:', err);
      }
    }
    return false;
  }, [categories, fetchCategories]);

  const deleteCategoryAsync = useCallback(async (name: string) => {
  if (!name) return false;

  const trimmed = name.trim();
  // Find the actual key in the map that matches (case-insensitive)
  const key = Array.from(categoryMap.keys()).find(
    k => k.toLowerCase() === trimmed.toLowerCase()
  );

  if (!key) return false;

  const categoryId = categoryMap.get(key);
  if (!categoryId) return false;

  // Check if any prizes exist in this category
  const hasPrizes = prizes.some(p => p.category?.toLowerCase() === key.toLowerCase());
  if (hasPrizes) return false;

  try {
    await apiDeleteCategory(categoryId);
    await fetchCategories();
    await fetchPrizes();
    return true;
  } catch (err) {
    console.error('Failed to delete category:', err);
    return false;
  }
}, [categoryMap, prizes, fetchCategories]);


  const addPrizeAsync = useCallback(
  async (name: string, category: Category) => {
    let categoryId = categoryMap.get(category);

    // 🔁 Category not in map → fetch again
    if (!categoryId) {
      await fetchCategories();
      categoryId = categoryMap.get(category);
    }

    if (!categoryId) {
      console.error('Category still not found:', category);
      return;
    }

    try {
      await apiCreatePrize({
        name,
        category_id: categoryId,
        is_drawn: false,
      });

      await fetchPrizes();
    } catch (err) {
      console.error('Failed to create prize:', err);
    }
  },
  [categoryMap, fetchCategories, fetchPrizes]
);

const addBulkPrizesAsync = useCallback(
  async (prizesDataOrFile: File | Array<{ name: string; category: string }>) => {
    try {
      let fileToSend: File;

      if (prizesDataOrFile instanceof File) {
        fileToSend = prizesDataOrFile;
      } else {
        // Convert array to CSV File
        fileToSend = arrayToCsvFile(prizesDataOrFile);
      }

      const formData = new FormData();
      formData.append('csv', fileToSend);

      const res = await apiImportPrizesCsv(formData); // ✅ Now accepts FormData
      console.log('Imported prizes:', res.data.imported_count);

      await fetchCategories();
      await fetchPrizes();
    } catch (err) {
      console.error('Failed to sync bulk prizes:', err);
      throw err;
    }
  },
  [fetchCategories, fetchPrizes]
);






  const updatePrizeAsync = useCallback(async (id: string, name: string, category: Category) => {
    const prize = prizes.find(p => p.id === id);
    const categoryId = categoryMap.get(category);
    if (prize?.apiId && categoryId) {
      try {
        await apiUpdatePrize(prize.apiId, { name, category_id: categoryId, is_drawn: prize.isAssigned });
        await fetchPrizes();
      } catch (err) {
        console.error('Failed to update prize:', err);
      }
    }
  }, [prizes, categoryMap, fetchPrizes]);

  const deletePrizeAsync = useCallback(async (id: string) => {
    const prize = prizes.find(p => p.id === id);
    if (prize?.apiId) {
      try {
        await apiDeletePrize(prize.apiId);
        await fetchPrizes();
      } catch (err) {
        console.error('Failed to delete prize:', err);
      }
    }
  }, [prizes, fetchPrizes]);

  // ===============================
// SYNC ADAPTER FUNCTIONS (UI SAFE)
// ===============================

const addCategory = useCallback((name: string): boolean => {
  const trimmed = name.trim().toUpperCase();
  if (!trimmed || categories.includes(trimmed)) return false;

  setCategories(prev => [...prev, trimmed]);

  addCategoryAsync(trimmed).catch(() => {
  });

  return true;
}, [categories, addCategoryAsync]);

const deleteCategory = useCallback((name: string): boolean => {
  // DO NOT optimistically remove category
  deleteCategoryAsync(name)
    .then(success => {
      if (!success) {
        console.warn('Category delete blocked');
      }
    })
    .catch(fetchCategories);

  return true;
}, [deleteCategoryAsync, fetchCategories]);

const addPrize = useCallback((name: string, category: Category): void => {
  const tempId = crypto.randomUUID();

  setPrizes(prev => [
    ...prev,
    { id: tempId, name, category, isAssigned: false },
  ]);

  addPrizeAsync(name, category).catch(() => {
    setPrizes(prev => prev.filter(p => p.id !== tempId));
  });
}, [addPrizeAsync]);

const addBulkPrizes = useCallback(
  (data: File | Array<{ name: string; category: string }>) => {
    // Optimistic UI
    if (Array.isArray(data)) {
      setPrizes(prev => [
        ...prev,
        ...data.map((p, i) => ({
          id: `temp-${Date.now()}-${i}`,
          name: p.name,
          category: p.category,
          isAssigned: false,
        })),
      ]);
    }

    addBulkPrizesAsync(data).catch(fetchPrizes);
    return Array.isArray(data) ? data.length : 0;
  },
  [addBulkPrizesAsync, fetchPrizes]
);



const updatePrize = useCallback(
  (id: string, name: string, category: Category): void => {
    setPrizes(prev =>
      prev.map(p => (p.id === id ? { ...p, name, category } : p))
    );

    updatePrizeAsync(id, name, category).catch(fetchPrizes);
  },
  [updatePrizeAsync, fetchPrizes]
);

const deletePrize = useCallback((id: string): void => {
  setPrizes(prev => prev.filter(p => p.id !== id));
  deletePrizeAsync(id).catch(fetchPrizes);
}, [deletePrizeAsync, fetchPrizes]);

  const getAvailablePrizes = useCallback((category: Category) => {
    return prizes.filter(p => p.category === category && !p.isAssigned);
  }, [prizes]);

  const getPrizesByCategory = useCallback((category: Category) => {
    return prizes.filter(p => p.category === category);
  }, [prizes]);

  const executeDraw = useCallback(
  async (
    category: Category,
    groupSize: GroupSize,
    onAnimationTick?: (shuffledTickets: string[]) => void
  ): Promise<DrawResult[]> => {
    const availablePrizes = getAvailablePrizes(category);

    if (tickets.length < groupSize || availablePrizes.length < groupSize) {
      return [];
    }

    setIsDrawing(true);

    // Animation phase - shuffle display for 2.5 seconds
    const animationDuration = 2500;
    const tickInterval = 80;
    const ticks = animationDuration / tickInterval;

    for (let i = 0; i < ticks; i++) {
      await new Promise(resolve => setTimeout(resolve, tickInterval));
      if (onAnimationTick) {
        const shuffled = [...tickets]
          .sort(() => Math.random() - 0.5)
          .slice(0, groupSize)
          .map(t => t.ticket_number); // ✅ map to string
        onAnimationTick(shuffled);
      }
    }

    // Actual random selection using crypto
    const selectedTickets: { id: number; ticket_number: string }[] = [];
    const ticketPool = [...tickets];

    for (let i = 0; i < groupSize; i++) {
      const randomArray = new Uint32Array(1);
      crypto.getRandomValues(randomArray);
      const randomIndex = randomArray[0] % ticketPool.length;
      selectedTickets.push(ticketPool[randomIndex]);
      ticketPool.splice(randomIndex, 1);
    }

    // Assign prizes and update backend
    const results: DrawResult[] = [];
    for (let index = 0; index < selectedTickets.length; index++) {
      const ticket = selectedTickets[index];
      const prize = availablePrizes[index];

      // Update prize as drawn in backend
      if (prize.apiId) {
        try {
          await apiUpdatePrize(prize.apiId, {
            name: prize.name,
            category_id: prize.categoryId!,
            is_drawn: true
          });
        } catch (err) {
          console.error('Failed to mark prize as drawn:', err);
        }
      }

      results.push({
        id: crypto.randomUUID(),
        ticketNumber: ticket.ticket_number, // ✅ use ticket_number
        prize: { ...prize, isAssigned: true, assignedTo: ticket.ticket_number },
        category,
        timestamp: new Date(),
      });
    }

    // Update local state
    removeTickets(selectedTickets.map(t => t.ticket_number)); // ✅ remove by ticket_number
    await fetchPrizes(); // Refresh prizes from server

    const historyEntry: DrawHistoryEntry = {
      id: crypto.randomUUID(),
      results,
      category,
      groupSize,
      timestamp: new Date(),
    };

    setCurrentResults(results);
    setHistory(prev => [historyEntry, ...prev]);

    try {
 for (const r of results) {
  await createDrawHistory({
    ticket_number: r.ticketNumber,
    prize_id: r.prize.apiId!,       // numeric ID from DB
    prize_name: r.prize.name,
    category: r.category,
    assigned_to: r.prize.assignedTo ?? r.ticketNumber,
    draw_timestamp: r.timestamp.toISOString(),
  });
}

} catch (err) {
  console.error('Failed to save draw history to backend:', err);
}


    setIsDrawing(false);

    return results;
  },
  [tickets, getAvailablePrizes, removeTickets, fetchPrizes]
);


  const resetAll = useCallback(() => {
    setTickets([]);
    setCurrentResults([]);
    setHistory([]);
    setIsDrawing(false);
    // Refetch from server
    fetchCategories();
    fetchPrizes();
    fetchHistory(); 
  }, [fetchCategories, fetchPrizes]);

  const clearCurrentResults = useCallback(() => {
    setCurrentResults([]);
  }, []);

  return {
    tickets,
    prizes,
    categories,
    currentResults,
    history,
    isDrawing,
    isLoading,
    addTickets,
    addTicketRange,
    removeTickets,
    clearTickets,
    addCategory,
    deleteCategory,
    addPrize,
    addBulkPrizes,
    updatePrize,
    deletePrize,
    getAvailablePrizes,
    getPrizesByCategory,
    executeDraw,
    resetAll,
    clearCurrentResults,
    refetchCategories: fetchCategories,
    refetchPrizes: fetchPrizes,
  };
}