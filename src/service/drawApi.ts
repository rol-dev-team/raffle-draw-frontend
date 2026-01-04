import { apiClient } from './apiConfig';

export interface DrawTicket {
  id: number;
  ticket_number: string;
  is_winner: boolean;
}

export interface CreateDrawTicketInput {
  ticket_number: string;
  is_winner?: boolean;
}

export const getDrawTickets = () =>
  apiClient.get<{ status: boolean; data: DrawTicket[] }>('/draw-tickets');

export const getDrawTicket = (id: number) =>
  apiClient.get<{ status: boolean; data: DrawTicket }>(`/draw-tickets/${id}`);

export const createDrawTicket = (data: CreateDrawTicketInput) =>
  apiClient.post<{ status: boolean; data: DrawTicket }>('/draw-tickets', data);

export const updateDrawTicket = (id: number, data: CreateDrawTicketInput) =>
  apiClient.put<{ status: boolean; data: DrawTicket }>(`/draw-tickets/${id}`, data);
