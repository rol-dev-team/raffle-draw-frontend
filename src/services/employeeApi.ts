import clientApi from './apiConfig';

export interface Employee {
  id: number;
  name: string;
  email: string;
}

export const getEmployees = () =>
  clientApi.get<{ status: boolean; data: Employee[] }>('/employees');

export const getEmployee = (id: number) =>
  clientApi.get<{ status: boolean; data: Employee }>(`/employees/${id}`);

export const createEmployee = (data: Partial<Employee>) =>
  clientApi.post<{ status: boolean; data: Employee }>('/employees', data);

export const updateEmployee = (id: number, data: Partial<Employee>) =>
  clientApi.put<{ status: boolean; data: Employee }>(`/employees/${id}`, data);

export const deleteEmployee = (id: number) =>
  clientApi.delete<{ status: boolean; message: string }>(`/employees/${id}`);

export const importEmployeesCsv = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return clientApi.post<{ status: boolean; message: string }>('/employees/import-csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};