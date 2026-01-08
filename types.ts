
export enum UserRole {
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR'
}

export enum RequisitionStatus {
  PENDING = 'PENDENTE',
  APPROVED = 'APROVADO',
  REJECTED = 'REJEITADO',
  COMPLETED = 'CONCLUIDO'
}

export enum MovementType {
  IN = 'ENTRADA',
  OUT = 'SAIDA'
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Sector {
  id: number;
  name: string;
}

export interface StockItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minLevel: number;
}

export interface StockMovement {
  id: number;
  itemId: number;
  itemName?: string; // Hydrated
  type: MovementType;
  quantity: number;
  date: string;
  userId: number;
  userName?: string; // Hydrated
  reason?: string;
}

export interface RequisitionItem {
  itemId: number;
  itemName?: string; // Hydrated for UI
  quantity: number;
}

export interface Requisition {
  id: number;
  sectorId: number;
  sectorName?: string; // Hydrated for UI
  nomeRequisitante: string; // REQUIRED FIELD
  date: string; // ISO String
  status: RequisitionStatus;
  items: RequisitionItem[];
  createdByUserId: number;
  createdByName?: string;
}

// Stats for dashboard
export interface DashboardStats {
  totalItems: number;
  lowStockItems: number;
  pendingRequisitions: number;
  completedRequisitions: number;
}