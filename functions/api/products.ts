import { Product } from "@/types/product";
import { parsePrice } from "@/lib/parse-price";

export const sampleProducts: Product[] = [];

const GOOGLE_SHEETS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ4RhFNa0snHZSD8lSJVpAs9hL6H52fKzcy7xMsrVX9ZJygwwYtSyzWK4rRbYCEjghbPXVzsZICcF0K/pub?output=csv";

export function normalizeText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Carga productos intentando primero la API serverless (/api/products).
 * Si estás en local (localhost) o la API devuelve HTML/error, recurre directamente a Google Sheets.
 */
export const getProducts = async (): Promise<Product[]> => {
  try {
    const response = await fetch("/api/products");

    if (response.ok) {
      const contentType = response.headers.get("content-type") || "";
      const text = await response.text();

      // Si no es HTML, parseamos el JSON devuelto por Cloudflare
      if (!text.trim().startsWith("<!doctype") && !text.trim().startsWith("<html") && contentType.includes("application/json")) {
        const data = JSON.parse(text);
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    }
  } catch {
    // Si la API falla o estamos en desarrollo local, continuamos al fallback
  }

  // FALLBACK: Carga directa desde Google Sheets (para desarrollo local o emergencias)
  try {
    return await fetchFromGoogleSheets();
  } catch (sheetError) {
    console.error("Error al obtener productos desde Google Sheets:", sheetError);
    return sampleProducts;
  }
};

/**
 * Parser de emergencia para Google Sheets
 */
async function fetchFromGoogleSheets(): Promise<Product[]> {
  const response = await fetch(GOOGLE_SHEETS_CSV_URL, { cache: "no-store" });
  if (!response.ok) throw new Error("Error en consulta CSV");

  const csvText = await response.text();
  if (!csvText.trim() || csvText.trim().startsWith("<!doctype")) return sampleProducts;

  const rows = parseCSV(csvText);
  if (rows.length <= 1) return sampleProducts;

  const headers = rows[0].map(h => normalizeText(h).replace(/[^a-z0-9]/g, ""));

  const getIndex = (keys: string[]) => {
    const normKeys = keys.map(k => normalizeText(k).replace(/[^a-z0-9]/g, ""));
    return headers.findIndex((h) => normKeys.includes(h));
  };

  const idIdx = getIndex(["id", "codigo"]);
  const nameIdx = getIndex(["nombre", "name", "producto", "product"]);
  const descIdx = getIndex(["descripcion", "description", "detalle"]);
  const priceIdx = getIndex(["precio", "price", "valor"]);
  const cat1Idx = getIndex(["categoria1", "1racategoria", "1acategoria", "type", "tipo"]);
  const cat2Idx = getIndex(["categoria2", "2dacategoria", "2acategoria", "subcategoria"]);
  const cat3Idx = getIndex(["categoria3", "3tacategoria", "3racategoria"]);
  const imgIdx = getIndex(["imagen", "images", "imagenes", "image", "foto"]);

  const products: Product[] = [];

  rows.slice(1).forEach((values, index) => {
    if (values.every((val) => !String(val ?? "").trim())) return;

    const getValue = (idx: number, fallbackIdx: number) => {
      const targetIdx = idx >= 0 ? idx : fallbackIdx;
      return targetIdx >= 0 && targetIdx < values.length ? values[targetIdx].trim() : "";
    };

    const id = getValue(idIdx, 0) || String(index + 1);
    let name = getValue(nameIdx, 1);
    const description = getValue(descIdx, 2);
    const rawPrice = getValue(priceIdx, 3);
    const price = parsePrice(rawPrice);

    const cat1 = getValue(cat1Idx, 4) || "Otros";
    const cat2 = getValue(cat2Idx, 5);
    const cat3 = getValue(cat3Idx, 6);

    let rawImage = getValue(imgIdx, 7);

    if (name.toLowerCase() === "imagen") {
      name = "Mate imperial Premium";
    }

    if (!rawImage || (!rawImage.includes("http") && !rawImage.includes("/"))) {
      const foundUrl = values.find((v) => v.includes("http") || v.includes("drive.google"));
      if (foundUrl) rawImage = foundUrl;
    }

    const images = parseMultipleImages(rawImage);
    const image = images[0] || "/placeholder.svg";

    if (name && price > 0) {
      products.push({
        id,
        name,
        description,
        price,
        type: cat1,
        subcategory: cat2,
        cat1,
        cat2,
        cat3,
        image,
        images,
      });
    }
  });

  return products.length > 0 ? products : sampleProducts;
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        cell += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === "," && !insideQuotes) {
      row.push(cell.trim());
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") i++;
      row.push(cell.trim());
      cell = "";
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    if (row.some((value) => value.trim() !== "")) rows.push(row);
  }

  return rows;
}

function getDirectDriveImageUrl(url: string): string {
  if (!url) return "/placeholder.svg";
  const cleanUrl = url.trim();
  const driveIdMatch =
    cleanUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || cleanUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);

  if (driveIdMatch?.[1]) {
    return `https://drive.google.com/thumbnail?id=${driveIdMatch[1]}&sz=w1000`;
  }

  if (!cleanUrl.startsWith("/") && !cleanUrl.startsWith("http")) {
    return `/${cleanUrl}`;
  }

  return cleanUrl;
}

function parseMultipleImages(rawImagesString: string): string[] {
  if (!rawImagesString?.trim()) return ["/placeholder.svg"];
  const urls = rawImagesString
    .split(",")
    .map((url) => url.trim())
    .filter((url) => url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/"));

  if (urls.length === 0) return ["/placeholder.svg"];
  return urls.map(getDirectDriveImageUrl);
}