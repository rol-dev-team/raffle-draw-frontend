import { useState, useCallback, useEffect } from 'react';
import {
  Prize,
  DrawResult,
  DrawHistoryEntry,
  Category,
  GroupSize,
  CategoryFromApi,
  PrizeFromApi,
} from '@/types/raffle';
import {
  getCategories,
  createCategory as apiCreateCategory,
  deleteCategory as apiDeleteCategory,
  importCategoriesCsv as apiCsvCategory,
} from '@/service/categoryApi';
import {
  getPrizes,
  createPrize as apiCreatePrize,
  updatePrize as apiUpdatePrize,
  deletePrize as apiDeletePrize,
  importPrizesCsv as apiImportPrizesCsv,
} from '@/service/prizeApi';
import {
  getDrawTicket,
  createDrawTicket as apiDrawTicket,
  updateDrawTicket as apiUpdateDrawTicket,
  deleteDrawTicket as apiDeleteDrawTicket,
  importDrawTicketsCsv as apiDrawTicketCSV,
} from '@/service/drawTicketApi';
import { getAllTickets } from '@/service/employeeApi';
import { v4 as uuidv4 } from 'uuid';

const arrayToCsvFile = (prizes: Array<{ name: string; category: string }>): File => {
  // Header must match backend: Category,Prize
  const csvRows = ['Category,Prize'];

  prizes.forEach((p) => {
    // Escape commas in names if needed
    const category = `"${p.category.replace(/"/g, '""')}"`;
    const name = `"${p.name.replace(/"/g, '""')}"`;
    csvRows.push(`${category},${name}`);
  });

  const csvString = csvRows.join('\n');
  return new File([csvString], 'prizes.csv', { type: 'text/csv' });
};

export function useRaffleState() {
  const [tickets, setTickets] = useState<string[]>([]);
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
      console.log('Fetched categories:', res.data);
      const apiCategories = res.data.data || [];
      const names = apiCategories.map((c) => c.name.toUpperCase());

      const map = new Map<string, number>();
      apiCategories.forEach((c) => map.set(c.name.toUpperCase(), c.id));

      setCategories(names);
      setCategoryMap(map);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  }, []);

  // Fetch prizes from API
  const fetchPrizes = useCallback(async () => {
    try {
      const prizesRes = await getPrizes();
      const apiPrizes = prizesRes.data.data || [];

      const mappedPrizes: Prize[] = apiPrizes
        .map((p) => {
          const categoryName = Array.from(categoryMap.entries()).find(
            ([, id]) => id === p.category_id
          )?.[0];

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

  //fetch tickets from API
  const fetchAllTickets = async () => {
    try {
      const res = await getAllTickets();
      setTickets(res.data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  useEffect(() => {
    fetchAllTickets();
  }, []);

  // Initial fetch
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      setIsLoading(true);
      // We wait for categories to finish and update state
      await fetchCategories();
      // We don't call fetchPrizes immediately because the categoryMap state
      // update from fetchCategories hasn't "hit" the next render cycle yet.
      setIsLoading(false);
    };

    init();
    return () => {
      isMounted = false;
    };
  }, [fetchCategories]);

  // Add a second effect that reacts when the map is actually populated
  useEffect(() => {
    if (categoryMap.size > 0) {
      fetchPrizes();
    }
  }, [categoryMap, fetchPrizes]);

  // const clearTickets = useCallback(async () => {
  //   for (const ticket of tickets) {
  //     try {
  //       await apiDeleteDrawTicket(ticket.id);
  //     } catch {}
  //   }
  //   await fetchTickets();
  // }, [tickets, fetchTickets]);

  // Category management
  const addCategoryAsync = useCallback(
    async (name: string) => {
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
    },
    [categories, fetchCategories]
  );

  const deleteCategoryAsync = useCallback(
    async (name: string) => {
      if (!name) return false;

      const trimmed = name.trim();
      // Find the actual key in the map that matches (case-insensitive)
      const key = Array.from(categoryMap.keys()).find(
        (k) => k.toLowerCase() === trimmed.toLowerCase()
      );

      if (!key) return false;

      const categoryId = categoryMap.get(key);
      if (!categoryId) return false;

      try {
        await apiDeleteCategory(categoryId);
        await fetchCategories();
        await fetchPrizes();
        return true;
      } catch (err) {
        console.error('Failed to delete category:', err);
        return false;
      }
    },
    [categoryMap, prizes, fetchCategories]
  );

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

  const updatePrizeAsync = useCallback(
    async (id: string, name: string, category: Category) => {
      const prize = prizes.find((p) => p.id === id);
      const categoryId = categoryMap.get(category);
      if (prize?.apiId && categoryId) {
        try {
          await apiUpdatePrize(prize.apiId, {
            name,
            category_id: categoryId,
            is_drawn: prize.isAssigned,
          });
          await fetchPrizes();
        } catch (err) {
          console.error('Failed to update prize:', err);
        }
      }
    },
    [prizes, categoryMap, fetchPrizes]
  );

  const deletePrizeAsync = useCallback(
    async (id: string) => {
      const prize = prizes.find((p) => p.id === id);
      if (prize?.apiId) {
        try {
          await apiDeletePrize(prize.apiId);
          await fetchPrizes();
        } catch (err) {
          console.error('Failed to delete prize:', err);
        }
      }
    },
    [prizes, fetchPrizes]
  );

  // ===============================
  // SYNC ADAPTER FUNCTIONS (UI SAFE)
  // ===============================

  const addCategory = useCallback(
    (name: string): boolean => {
      const trimmed = name.trim().toUpperCase();
      if (!trimmed || categories.includes(trimmed)) return false;

      setCategories((prev) => [...prev, trimmed]);

      addCategoryAsync(trimmed).catch(() => {});

      return true;
    },
    [categories, addCategoryAsync]
  );

  const deleteCategory = useCallback(
    (name: string): boolean => {
      // DO NOT optimistically remove category
      deleteCategoryAsync(name)
        .then((success) => {
          if (!success) {
            console.warn('Category delete blocked');
          }
        })
        .catch(fetchCategories);

      return true;
    },
    [deleteCategoryAsync, fetchCategories]
  );

  const addPrize = useCallback(
    (name: string, category: Category): void => {
      // const tempId = crypto.randomUUID();
      const tempId = uuidv4();

      setPrizes((prev) => [...prev, { id: tempId, name, category, isAssigned: false }]);

      addPrizeAsync(name, category).catch(() => {
        setPrizes((prev) => prev.filter((p) => p.id !== tempId));
      });
    },
    [addPrizeAsync]
  );

  const addBulkPrizes = useCallback(
    (data: File | Array<{ name: string; category: string }>) => {
      // Optimistic UI
      if (Array.isArray(data)) {
        setPrizes((prev) => [
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
      setPrizes((prev) => prev.map((p) => (p.id === id ? { ...p, name, category } : p)));

      updatePrizeAsync(id, name, category).catch(fetchPrizes);
    },
    [updatePrizeAsync, fetchPrizes]
  );

  const deletePrize = useCallback(
    (id: string): void => {
      setPrizes((prev) => prev.filter((p) => p.id !== id));
      deletePrizeAsync(id).catch(fetchPrizes);
    },
    [deletePrizeAsync, fetchPrizes]
  );

  const getAvailablePrizes = useCallback(
    (category: Category) => {
      return prizes.filter((p) => p.category === category && !p.isAssigned);
    },
    [prizes]
  );

  const getPrizesByCategory = useCallback(
    (category: Category) => {
      console.log('Getting prizes for category:', category);
      return prizes.filter((p) => p.category === category);
    },
    [prizes]
  );

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
        await new Promise((resolve) => setTimeout(resolve, tickInterval));
        if (onAnimationTick) {
          const shuffled = [...tickets].sort(() => Math.random() - 0.5).slice(0, groupSize);
          onAnimationTick(shuffled);
        }
      }

      // Actual random selection using crypto
      const selectedTickets: string[] = [];
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
              is_drawn: true,
            });
          } catch (err) {
            console.error('Failed to mark prize as drawn:', err);
          }
        }

        results.push({
          id: crypto.randomUUID(),
          ticketNumber: ticket,
          prize: { ...prize, isAssigned: true, assignedTo: ticket },
          category,
          timestamp: new Date(),
        });
      }

      // Update local state
      await fetchPrizes(); // Refresh prizes from server

      const historyEntry: DrawHistoryEntry = {
        id: crypto.randomUUID(),
        results,
        category,
        groupSize,
        timestamp: new Date(),
      };

      setCurrentResults(results);
      setHistory((prev) => [historyEntry, ...prev]);
      setIsDrawing(false);

      return results;
    },
    [tickets, getAvailablePrizes, fetchPrizes]
  );

  const resetAll = useCallback(() => {
    setTickets([]);
    setCurrentResults([]);
    setHistory([]);
    setIsDrawing(false);
    // Refetch from server
    fetchCategories();
    fetchPrizes();
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
    refetchTickets: fetchAllTickets,
  };
}
