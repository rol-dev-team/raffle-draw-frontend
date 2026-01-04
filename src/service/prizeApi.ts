import { apiClient } from './apiConfig';

export interface PrizeApi {
  id: number;
  name: string;
  category_id: number;
  is_drawn: boolean;
}

export interface CreatePrizeInput {
  name: string;
  category_id: number;
  is_drawn?: boolean;
}

export interface UpdatePrizeInput {
  name: string;
  category_id: number;
  is_drawn?: boolean;
}

export const getPrizes = () => apiClient.get<{ status: boolean; data: PrizeApi[] }>('/prizes');

export const getPrize = (id: number) =>
  apiClient.get<{ status: boolean; data: PrizeApi }>(`/prizes/${id}`);

export const createPrize = (data: CreatePrizeInput) =>
  apiClient.post<{ status: boolean; data: PrizeApi }>('/prizes', data);

export const updatePrize = (id: number, data: UpdatePrizeInput) =>
  apiClient.put<{ status: boolean; data: PrizeApi }>(`/prizes/${id}`, data);

export const deletePrize = (id: number) =>
  apiClient.delete<{ status: boolean; message: string }>(`/prizes/${id}`);

export const importPrizesCsv = (formData: FormData) => {
  return apiClient.post<{
    status: boolean;
    imported_count: number;
    errors: Record<number, string[]>;
  }>('/prizes/import-csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
