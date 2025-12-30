import clientApi from './apiConfig';

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
  clientApi.get<{ status: boolean; data: DrawTicket[] }>('/draw-tickets');

export const getDrawTicket = (id: number) =>
  clientApi.get<{ status: boolean; data: DrawTicket }>(`/draw-tickets/${id}`);

export const createDrawTicket = (data: CreateDrawTicketInput) =>
  clientApi.post<{ status: boolean; data: DrawTicket }>('/draw-tickets', data);

export const updateDrawTicket = (id: number, data: CreateDrawTicketInput) =>
  clientApi.put<{ status: boolean; data: DrawTicket }>(`/draw-tickets/${id}`, data);