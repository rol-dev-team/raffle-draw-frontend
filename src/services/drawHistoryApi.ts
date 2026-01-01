import clientApi from './apiConfig';
import { CreateDrawHistoryPayload } from '@/types/raffle';

/* =====================================================
   TYPES (Used only for frontend display if needed)
===================================================== */

export interface DrawHistoryResult {
  id: string;
  ticketNumber: string;
  prize: {
    id: string;
    name: string;
    assignedTo?: string;
    isAssigned: boolean;
  };
  category: string;
  timestamp: string;
}

export interface DrawHistoryEntry {
  id: string;
  results: DrawHistoryResult[];
  category: string;
  groupSize: number;
  timestamp: string;
}

/* =====================================================
   API CALLS
===================================================== */

/**
 * Get all draw histories
 */
export const getDrawHistories = () =>
  clientApi.get<{
    status: boolean;
    data: DrawHistoryEntry[];
  }>('/result-histories');

/**
 * Get single draw history by ID
 */
export const getDrawHistory = (id: number | string) =>
  clientApi.get<{
    status: boolean;
    data: DrawHistoryEntry;
  }>(`/result-histories/${id}`);

/**
 * Create / store draw history (after a draw)
 */
export const createDrawHistory = (payload: CreateDrawHistoryPayload) =>
  clientApi.post<{
    status: boolean;
  }>('/result-histories', payload);

/**
 * Delete all draw histories (reset)
 */
export const resetDrawHistories = () =>
  clientApi.delete<{
    status: boolean;
  }>('/result-histories');
