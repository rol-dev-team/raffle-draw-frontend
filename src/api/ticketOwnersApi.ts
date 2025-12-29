// ticketOwnersApi.ts
import apiClient from "./apiClient";
import { TicketOwner } from "@/pages/TicketOwners";

export const getOwners = async (): Promise<TicketOwner[]> => {
  const response = await apiClient.get("/employees");
  return response.data;
};

export const addOwner = async (owner: Omit<TicketOwner, "id">) => {
  const response = await apiClient.post("/employees", owner);
  return response.data;
};

export const updateOwner = async (id: string, data: Partial<TicketOwner>) => {
  const response = await apiClient.put(`/employees/${id}`, data);
  return response.data;
};

export const deleteOwner = async (id: string) => {
  const response = await apiClient.delete(`/employees/${id}`);
  return response.data;
};
