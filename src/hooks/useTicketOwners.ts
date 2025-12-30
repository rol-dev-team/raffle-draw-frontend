import { useState, useCallback, useRef, useEffect } from 'react';
import { TicketOwner, TicketFromApi, EmployeeFromApi } from '@/types/raffle';
import { getTickets} from './../services/ticketApi';
import { getEmployees } from './../services/employeeApi';

export function useTicketOwners() {
  const [owners, setOwners] = useState<TicketOwner[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ownersRef = useRef<TicketOwner[]>([]);

  // Update ref whenever we update state
  const setOwnersWithRef = useCallback((updater: TicketOwner[] | ((prev: TicketOwner[]) => TicketOwner[])) => {
    setOwners(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      ownersRef.current = next;
      return next;
    });
  }, []);

  // Fetch employees and their tickets from the API
  const fetchOwners = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [employeesRes, ticketsRes] = await Promise.all([
        getEmployees(),
        getTickets()
      ]);

      const employees = employeesRes.data.data || [];
      const tickets = ticketsRes.data.data || [];

      // Group tickets by employee
      const ticketsByEmployee = tickets.reduce((acc, ticket) => {
        if (!acc[ticket.employee_id]) {
          acc[ticket.employee_id] = [];
        }
        acc[ticket.employee_id].push(ticket.ticket_no);
        return acc;
      }, {} as Record<number, string[]>);

      // Map employees to TicketOwner format
      const mappedOwners: TicketOwner[] = employees.map(emp => ({
        id: emp.id.toString(),
        name: emp.name,
        email: emp.email,
        ticketNumbers: ticketsByEmployee[emp.id] || [],
        apiId: emp.id,
      }));

      setOwnersWithRef(mappedOwners);
    } catch (err) {
      console.error('Failed to fetch owners:', err);
      setError('Failed to load ticket owners from server');
    } finally {
      setIsLoading(false);
    }
  }, [setOwnersWithRef]);

  // Fetch on mount
  useEffect(() => {
    fetchOwners();
  }, [fetchOwners]);

  const addOwner = useCallback((name: string, ticketNumbers: string[]) => {
    const newOwner: TicketOwner = {
      id: crypto.randomUUID(),
      name: name.trim(),
      ticketNumbers: ticketNumbers.map(t => t.trim()).filter(t => t),
    };
    setOwnersWithRef(prev => [...prev, newOwner]);
    return newOwner;
  }, [setOwnersWithRef]);

  const updateOwner = useCallback((id: string, name: string, ticketNumbers: string[]) => {
    setOwnersWithRef(prev => prev.map(o =>
      o.id === id
        ? { ...o, name: name.trim(), ticketNumbers: ticketNumbers.map(t => t.trim()).filter(t => t) }
        : o
    ));
  }, [setOwnersWithRef]);

  const deleteOwner = useCallback((id: string) => {
    setOwnersWithRef(prev => prev.filter(o => o.id !== id));
  }, [setOwnersWithRef]);

  const getOwnerByTicket = useCallback((ticketNumber: string): TicketOwner | undefined => {
    return ownersRef.current.find(o => o.ticketNumbers.includes(ticketNumber));
  }, []);

  const getAllTicketsFromOwners = useCallback((): string[] => {
    return ownersRef.current.flatMap(o => o.ticketNumbers);
  }, []);

  const addBulkOwners = useCallback((data: Array<{ name: string; ticketNumbers: string[] }>) => {
    const newOwners: TicketOwner[] = data.map(d => ({
      id: crypto.randomUUID(),
      name: d.name.trim(),
      ticketNumbers: d.ticketNumbers.map(t => t.trim()).filter(t => t),
    }));
    setOwnersWithRef(prev => [...prev, ...newOwners]);
    return newOwners.length;
  }, [setOwnersWithRef]);

  const resetOwners = useCallback(() => {
    setOwnersWithRef([]);
  }, [setOwnersWithRef]);

  return {
    owners,
    isLoading,
    error,
    addOwner,
    updateOwner,
    deleteOwner,
    getOwnerByTicket,
    getAllTicketsFromOwners,
    addBulkOwners,
    resetOwners,
    refetchOwners: fetchOwners,
  };
}