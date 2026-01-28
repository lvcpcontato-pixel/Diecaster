
import { Car } from '../types';

/**
 * CONFIGURAÇÃO MESTRA DO APP (MEMÓRIA NATIVA)
 * Aqui residem as chaves que permitem o funcionamento sem configuração manual.
 */
const APP_CONFIG = {
  CLIENT_ID: '618943723631-48c9i2groird8g221ovrgoij5j2d173o.apps.googleusercontent.com',
  SYNC_URL: 'https://script.google.com/macros/s/AKfycbzhTn9t-q6UfUncD65H_2txU8HRAECP8_vqAA1yr7zFZ1YAZEx8U0oH7RXCmR2oFk5NxQ/exec'
};

const STORAGE_KEY = 'diecast_collection_db_v17';

export const getSyncUrl = () => APP_CONFIG.SYNC_URL;
export const getGoogleClientId = () => APP_CONFIG.CLIENT_ID;

// Funções de compatibilidade (mantidas para não quebrar referências, mas agora são estáticas)
export const setSyncUrl = (url: string) => console.warn("A URL agora é fixa no código.");
export const setGoogleClientId = (id: string) => console.warn("O Client ID agora é fixo no código.");

export const getCars = async (): Promise<Car[]> => {
  const syncUrl = getSyncUrl();
  try {
    const response = await fetch(`${syncUrl}?t=${Date.now()}`);
    if (!response.ok) throw new Error('Erro na rede');
    const data = await response.json();
    if (Array.isArray(data)) {
      const mappedData = data.map((item: any, index: number) => ({
        id: String(item.id || `sheet-${index}`),
        marca: String(item.marca || ''),
        modelo: String(item.modelo || ''),
        fabricante: String(item.fabricante || ''),
        cor: String(item.cor || ''),
        ano: String(item.ano || ''),
        pack: String(item.pack || ''),
        observacoes: String(item.observacoes || ''),
        fotoUrl: String(item.foto || item.fotourl || '')
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mappedData));
      return mappedData;
    }
  } catch (e) {
    console.warn("Usando cache local:", e);
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveCar = async (car: Car): Promise<Car[]> => {
  const syncUrl = getSyncUrl();
  const stored = localStorage.getItem(STORAGE_KEY);
  const cars = stored ? JSON.parse(stored) : [];
  const existingIndex = cars.findIndex((c: Car) => c.id === car.id);
  let newCars = existingIndex >= 0 ? [...cars] : [car, ...cars];
  if (existingIndex >= 0) newCars[existingIndex] = car;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newCars));

  try {
    await fetch(syncUrl, {
      method: 'POST',
      body: JSON.stringify({ action: 'upsert', car })
    });
  } catch (e) {
    console.error("Erro ao sincronizar:", e);
  }
  return newCars;
};

export const deleteCar = async (id: string): Promise<Car[]> => {
  const syncUrl = getSyncUrl();
  const cars = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const newCars = cars.filter((c: Car) => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newCars));
  try {
    await fetch(syncUrl, { method: 'POST', body: JSON.stringify({ action: 'delete', id }) });
  } catch (e) { console.error(e); }
  return newCars;
};

export const pushAllToCloud = async (cars: Car[]): Promise<void> => {
  const syncUrl = getSyncUrl();
  for (const car of cars) {
    try {
      await fetch(syncUrl, { 
        method: 'POST', 
        body: JSON.stringify({ action: 'upsert', car }) 
      });
    } catch (e) { 
      console.error("Erro no item:", car.modelo, e); 
    }
  }
};

export const exportToCSV = (cars: Car[]): string => {
  const headers = ['Marca', 'Modelo', 'Fabricante', 'Cor', 'Ano', 'Pack', 'Observações', 'Foto URL'];
  return [headers.join(','), ...cars.map(c => [c.marca, c.modelo, c.fabricante, c.cor, c.ano || '', c.pack || '', c.observacoes || '', c.fotoUrl || ''].map(f => `"${String(f).replace(/"/g, '""')}"`).join(','))].join('\n');
};

export const parseCSV = (csvText: string): Car[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 1) return [];
  const newCars: Car[] = [];
  const startIndex = (lines[0].toLowerCase().includes('marca')) ? 1 : 0;
  for (let i = startIndex; i < lines.length; i++) {
    const parts = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    if (parts.length >= 3) {
      const clean = parts.map(p => p.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
      newCars.push({
        id: 'csv-' + Date.now() + Math.random(),
        marca: clean[0], modelo: clean[1], fabricante: clean[2],
        cor: clean[3], ano: clean[4], pack: clean[5], observacoes: clean[6], fotoUrl: clean[7]
      });
    }
  }
  return newCars;
};

export const importBatch = async (newCars: Car[]): Promise<Car[]> => {
  const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const combined = [...newCars, ...current];
  const unique = combined.filter((v,i,a)=>a.findIndex(v2=>(v2.id===v.id))===i);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
  return unique;
}
