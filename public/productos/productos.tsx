import { Product } from "@/types/product";

export const sampleProducts: Product[] = [];

/**
 * Normaliza textos para comparaciones de filtros en la interfaz React
 */
export function normalizeText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Consulta la API serverless de Cloudflare
 */
export const getProducts = async (): Promise<Product[]> => {
  try {
    const response = await fetch("/api/products");

    if (!response.ok) {
      throw new Error(`Error en API HTTP ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) && data.length > 0 ? data : sampleProducts;
  } catch (error) {
    console.error("Error al obtener productos desde API:", error);
    return sampleProducts;
  }
};