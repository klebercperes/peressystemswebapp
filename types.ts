
export enum TicketStatus {
  Open = 'Open',
  InProgress = 'In Progress',
  Resolved = 'Resolved',
  Closed = 'Closed',
}

export interface Client {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  joinDate: string;
}

export interface Asset {
  id: string;
  clientId: string;
  name: string;
  type: 'Laptop' | 'Desktop' | 'Server' | 'Printer' | 'Router' | 'Other';
  purchaseDate: string;
  warrantyEndDate: string;
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
