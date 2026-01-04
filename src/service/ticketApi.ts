import { apiClient } from './apiConfig';

export interface TicketApi {
  id: number;
  employee_id: number;
  ticket_no: string;
  ticket_type: string;
  issue_date: string;
  expire_date: string;
  price: number;
  status: string;
}

export interface CreateTicketInput {
  employee_id: number;
  ticket_no: string;
  ticket_type: string;
  issue_date: string;
  expire_date: string;
  price: number;
  status: string;
}

export interface UpdateTicketInput extends Partial<CreateTicketInput> {}

export const getTickets = () => apiClient.get<{ status: boolean; data: TicketApi[] }>('/tickets');

export const getTicket = (id: number) =>
  apiClient.get<{ status: boolean; data: TicketApi }>(`/tickets/${id}`);

export const createTicket = (data: CreateTicketInput) =>
  apiClient.post<{ status: boolean; data: TicketApi }>('/tickets', data);

export const updateTicket = (id: number, data: UpdateTicketInput) =>
  apiClient.put<{ status: boolean; data: TicketApi }>(`/tickets/${id}`, data);

export const deleteTicket = (id: number) =>
  apiClient.delete<{ status: boolean; message: string }>(`/tickets/${id}`);

export const importTicketsCsv = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post<{ status: boolean; message: string }>('/tickets/import-csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
