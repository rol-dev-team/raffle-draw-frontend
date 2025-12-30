import clientApi from './apiConfig';

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

export const getTickets = () =>
  clientApi.get<{ status: boolean; data: TicketApi[] }>('/tickets');

export const getTicket = (id: number) =>
  clientApi.get<{ status: boolean; data: TicketApi }>(`/tickets/${id}`);

export const createTicket = (data: CreateTicketInput) =>
  clientApi.post<{ status: boolean; data: TicketApi }>('/tickets', data);

export const updateTicket = (id: number, data: UpdateTicketInput) =>
  clientApi.put<{ status: boolean; data: TicketApi }>(`/tickets/${id}`, data);

export const deleteTicket = (id: number) =>
  clientApi.delete<{ status: boolean; message: string }>(`/tickets/${id}`);

export const importTicketsCsv = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return clientApi.post<{ status: boolean; message: string }>('/tickets/import-csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};