export type Category = string;

export type GroupSize = number;

export interface Prize {
  id: string;
  name: string;
  category: Category;
  isAssigned: boolean;
  assignedTo?: string;
  // Backend mapping
  apiId?: number;
  categoryId?: number;
}

export interface DrawResult {
  id: string;
  ticketNumber: string;
  prize: Prize;
  category: Category;
  timestamp: Date;
  ownerName?: string;
}

export interface DrawHistoryEntry {
  id: string;
  results: DrawResult[];
  category: Category;
  groupSize: GroupSize;
  timestamp: Date;
}

export interface TicketOwner {
  id: string;
  name: string;
  ticketNumbers: string[];
  email?: string;
  // Backend mapping
  apiId?: number;
}

// API response types
export interface CategoryFromApi {
  id: number;
  name: string;
}

export interface PrizeFromApi {
  id: number;
  name: string;
  category_id: number;
  is_drawn: boolean;
}

export interface TicketFromApi {
  id: number;
  employee_id: number;
  ticket_no: string;
  ticket_type: string;
  issue_date: string;
  expire_date: string;
  price: number;
  status: string;
}

export interface EmployeeFromApi {
  id: number;
  name: string;
  email: string;
}