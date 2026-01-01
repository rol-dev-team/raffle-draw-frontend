import clientApi from './apiConfig';

export const getDrawTicket = () => clientApi.get('/draw-tickets');
export const createDrawTicket = (data: { ticket_number: string }) => clientApi.post('/draw-tickets', data);
export const updateDrawTicket = (id: number, data: { ticket_number?: string; is_winner?: boolean }) =>
  clientApi.put(`/draw-tickets/${id}`, data);
export const deleteDrawTicket = (id: number) => clientApi.delete(`/draw-tickets/${id}`);
export const importDrawTicketsCsv = (formData: FormData) =>
  clientApi.post('/draw-tickets/import-csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
