import { Product } from "@/types/product";
import { parsePrice } from "@/lib/parse-price";

export const sampleProducts: Product[] = [];

const PRODUCTS_API_URL = "/api/products.json";

export function normalizeText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export const getProducts = async (): Promise<Product[]> => {
  try {
    const response = await fetch(PRODUCTS_API_URL, {
      cache: "default",
    });

    if (!response.ok) {
      throw new Error(`Error al consultar productos. HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
    
    return sampleProducts;
  } catch (error) {
    console.error("Error al obtener productos desde API:", error);
    return sampleProducts;
  }
};

// Helpers necesarios para el frontend (las URLs de Drive ya vienen normalizadas del Worker)
function getDirectDriveImageUrl(url: string): string {
  if (!url) return "/placeholder.svg";

  const cleanUrl = url.trim();
  const driveIdMatch =
    cleanUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) ||
    cleanUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);

  if (driveIdMatch?.[1]) {
    const fileId = driveIdMatch[1];
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
  }

  if (!cleanUrl.startsWith("/") && !cleanUrl.startsWith("http")) {
    return `/${cleanUrl}`;
  }

  return cleanUrl;
}

function parseMultipleImages(rawImagesString: string): string[] {
  if (!rawImagesString?.trim()) {
    return ["/placeholder.svg"];
  }

  const urls = rawImagesString
    .split(",")
    .map((url) => url.trim())
    .filter((url) => {
      return (
        url.startsWith("http://") ||
        url.startsWith("https://") ||
        url.startsWith("/")
      );
    });

  if (urls.length === 0) {
    return ["/placeholder.svg"];
  }

  return urls.map(getDirectDriveImageUrl);
}