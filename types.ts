export enum TicketStatus {
  Open = 'Open',
  InProgress = 'In Progress',
  Paused = 'Paused',
  Completed = 'Completed',
  Canceled = 'Canceled',
  Closed = 'Closed',
}

export interface Client {
  id: string;
  name: string; // Business Name
  abn: string;
  contactPerson: string;
  email: string;
  address: string;
  phone: string; // Business Phone
  mobilePhone: string;
  joinDate: string;
  details?: string;
}

export interface Asset {
  id: string;
  clientId: string;
  name: string;
  type: 'Laptop' | 'Desktop' | 'Server' | 'Printer' | 'Router' | 'Other';
  purchaseDate: string;
  warrantyEndDate: string;
  notes?: string;
}

export interface Ticket {
  id: string;
  clientId: string;
  title: string;
  description: string;
  status: TicketStatus;
  createdDate: string;
  resolvedDate?: string;
}

export type View = 'dashboard' | 'clients' | 'tickets' | 'assets' | 'ai-assistant';