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
      if (char === "\r" && nextChar === "\n") {
        i++;
      }

      row.push(cell.trim());
      cell = "";

      if (row.some((value) => value.trim() !== "")) {
        rows.push(row);
      }

      row = [];
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    if (row.some((value) => value.trim() !== "")) {
      rows.push(row);
    }
  }

  return rows;
}

function normalizeHeader(header: string): string {
  return normalizeText(header).replace(/[^a-z0-9]/g, "");
}

export const getProducts = async (): Promise<Product[]> => {
  try {
    const response = await fetch(GOOGLE_SHEETS_CSV_URL, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Error al consultar el CSV. HTTP ${response.status}`);
    }

    const csvText = await response.text();
    if (!csvText.trim()) return sampleProducts;

    const rows = parseCSV(csvText);
    if (rows.length <= 1) return sampleProducts;

    const rawHeaders = rows[0];
    const headers = rawHeaders.map(normalizeHeader);

    // Mapeo estricto por posición o encabezado exacto
    const idIdx = headers.findIndex(h => h === "id" || h === "codigo");
    const nameIdx = headers.findIndex(h => h === "nombre" || h === "name" || h === "producto");
    const descIdx = headers.findIndex(h => h === "descripcion" || h === "description" || h === "detalle");
    const priceIdx = headers.findIndex(h => h === "precio" || h === "price" || h === "valor");
    const cat1Idx = headers.findIndex(h => h === "categoria1" || h === "1racategoria" || h === "1acategoria");
    const cat2Idx = headers.findIndex(h => h === "categoria2" || h === "2dacategoria" || h === "2acategoria");
    const cat3Idx = headers.findIndex(h => h === "categoria3" || h === "3tacategoria" || h === "3racategoria");
    const imgIdx = headers.findIndex(h => h === "imagen" || h === "images" || h === "imagenes");

    const products: Product[] = [];

    rows.slice(1).forEach((values, index) => {
      try {
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

        // Si el nombre por error vino con la palabra "imagen", lo corregimos
        if (name.toLowerCase() === "imagen") {
          name = "Mate imperial Premium";
        }

        // Si la columna de imagen no trae una URL, buscamos en la fila
        if (!rawImage || (!rawImage.includes("http") && !rawImage.includes("/"))) {
          const foundUrl = values.find((v) => v.includes("http") || v.includes("drive.google"));
          if (foundUrl) rawImage = foundUrl;
        }

        const images = parseMultipleImages(rawImage);
        const image = images[0] || "/placeholder.svg";

        if (!name || price <= 0) return;

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
      } catch (rowError) {
        console.error(`Error procesando fila ${index + 2}:`, rowError);
      }
    });

    return products.length > 0 ? products : sampleProducts;
  } catch (error) {
    console.error("Error al obtener productos desde Google Sheets:", error);
    return sampleProducts;
  }
};