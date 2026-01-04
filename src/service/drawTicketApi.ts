import { apiClient } from './apiConfig';

// Interfaces
export interface DrawTicketApi {
  id: number;
  ticket_number: string;
  is_winner: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateDrawTicketInput {
  ticket_number: string;
  is_winner?: boolean;
}

export interface UpdateDrawTicketInput {
  ticket_number?: string;
  is_winner?: boolean;
}

// API functions
export const getDrawTickets = () =>
  apiClient.get<{ status: boolean; data: DrawTicketApi[] }>('/draw-tickets');

export const getDrawTicket = (id: number) =>
  apiClient.get<{ status: boolean; data: DrawTicketApi }>(`/draw-tickets/${id}`);

// Create a single ticket
export const createDrawTicket = (ticket: { ticket_number: string }) =>
  apiClient.post('/draw-tickets', ticket);

export const updateDrawTicket = (id: number, data: UpdateDrawTicketInput) =>
  apiClient.put<{ status: boolean; data: DrawTicketApi }>(`/draw-tickets/${id}`, data);

export const deleteDrawTicket = (id: number) =>
  apiClient.delete<{ status: boolean; message: string }>(`/draw-tickets/${id}`);

// CSV import
export const importDrawTicketsCsv = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post('/draw-tickets/import-csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
