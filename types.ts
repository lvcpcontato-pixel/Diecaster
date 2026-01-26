
export interface Car {
  id: string;
  marca: string;      
  modelo: string;     
  fabricante: string; 
  cor: string;        
  ano?: string;       
  pack?: string;      
  observacoes?: string; 
  fotoUrl?: string;    // URL from Google Drive
  fotoBase64?: string; // Temporary storage for upload
}

export interface UserProfile {
  name: string;
  email: string;
  picture: string;
}

export interface DashboardStats {
  totalCars: number;
  topBrands: { name: string; value: number }[];
  topManufacturers: { name: string; value: number }[];
  topColors: { name: string; value: number }[];
}

export type ViewState = 'login' | 'dashboard' | 'list' | 'add' | 'data' | 'scanner' | 'new-choice';
