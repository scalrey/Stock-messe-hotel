
import { User, UserRole, Sector, StockItem, Requisition, DashboardStats, StockMovement, MovementType } from '../types';

// ==========================================
// CONFIGURAÇÃO DA LIGAÇÃO AO BACKEND
// ==========================================
// Se quiser testar SEM o banco de dados ligado, mude para false
const USE_REAL_BACKEND = true; 

const getApiUrl = () => {
  const { hostname, protocol, port } = window.location;
  
  // Se estiver em desenvolvimento local (Vite/React)
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Se o frontend está na 3000 e o backend Node na 3001
    if (port === '3000') return `http://${hostname}:3001/api`;
    
    // Se estiver a usar XAMPP/PHP local
    return `${protocol}//${hostname}/messe-hotel/backend`;
  }
  
  // Em produção (Hostinger)
  return '/backend'; 
};

export const API_URL = getApiUrl();

const mockApi = {
  login: async (email: string, password?: string): Promise<User | null> => {
    console.log("Mock Login:", email);
    if (email === 'admin@messe.com' && password === '123456') {
      return { id: 1, name: 'Admin Mock', email, role: UserRole.ADMIN };
    }
    return null;
  },
  getStats: async () => ({ totalItems: 10, lowStockItems: 2, pendingRequisitions: 1, completedRequisitions: 5 }),
  getStock: async () => [],
  getSectors: async () => [{id: 1, name: 'Bar'}, {id: 2, name: 'Cozinha'}],
  getRequisitions: async () => [],
  getUsers: async () => [],
  getAllMovements: async () => [],
  createMovement: async () => true,
  createRequisition: async () => ({ success: true }),
  createStockItem: async (item: any) => ({ ...item, id: Math.random() }),
  // Add missing createUser to mockApi
  createUser: async (user: Omit<User, 'id'>) => ({ ...user, id: Math.random() }),
  updateUser: async () => {},
  deleteUser: async () => {},
  getItemMovements: async () => []
};

const realApi = {
  login: async (email: string, password?: string): Promise<User | null> => {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: controller.signal
      });
      clearTimeout(id);

      if (res.status === 401) return null;
      if (!res.ok) throw new Error(`Erro servidor: ${res.status}`);
      
      return res.json();
    } catch (error: any) {
      console.error("Erro Conexão API:", error);
      throw new Error(error.name === 'AbortError' ? 'Servidor demorou a responder' : 'Não foi possível conectar ao servidor');
    }
  },

  getStats: async (): Promise<DashboardStats> => {
    const res = await fetch(`${API_URL}/stats`);
    return res.json();
  },

  getStock: async (): Promise<StockItem[]> => {
    const res = await fetch(`${API_URL}/stock`);
    return res.json();
  },

  createStockItem: async (item: Omit<StockItem, 'id'>): Promise<StockItem> => {
    const res = await fetch(`${API_URL}/stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    return res.json();
  },

  getItemMovements: async (itemId: number): Promise<StockMovement[]> => {
    const res = await fetch(`${API_URL}/movements/item/${itemId}`);
    return res.json();
  },

  getAllMovements: async (): Promise<StockMovement[]> => {
    const res = await fetch(`${API_URL}/movements`);
    return res.json();
  },

  createMovement: async (data: any) => {
    const res = await fetch(`${API_URL}/movements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.ok;
  },

  getSectors: async (): Promise<Sector[]> => {
    const res = await fetch(`${API_URL}/sectors`);
    return res.json();
  },

  getRequisitions: async (): Promise<Requisition[]> => {
    const res = await fetch(`${API_URL}/requisitions`);
    return res.json();
  },

  createRequisition: async (data: any) => {
    const res = await fetch(`${API_URL}/requisitions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getUsers: async (): Promise<User[]> => {
    const res = await fetch(`${API_URL}/users`);
    return res.json();
  },

  createUser: async (user: Omit<User, 'id'>) => {
    const res = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    return res.json();
  },

  updateUser: async (user: User) => {
    await fetch(`${API_URL}/users`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
  },

  deleteUser: async (id: number) => {
    await fetch(`${API_URL}/users/${id}`, { method: 'DELETE' });
  }
};

export const api = USE_REAL_BACKEND ? realApi : mockApi;
