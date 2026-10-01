import { Product } from "@/types/product";
import { parsePrice } from "@/lib/parse-price";

export const sampleProducts: Product[] = [];

const GOOGLE_SHEETS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ4RhFNa0snHZSD8lSJVpAs9hL6H52fKzcy7xMsrVX9ZJygwwYtSyzWK4rRbYCEjghbPXVzsZICcF0K/pub?output=csv";

function getDirectDriveImageUrl(url: string): string {
  if (!url) return "/placeholder.svg";

  const driveIdMatch =
    url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);

  if (driveIdMatch && driveIdMatch[1]) {
    const fileId = driveIdMatch[1];
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
  }

  if (!url.startsWith("/") && !url.startsWith("http")) {
    return "/" + url;
  }

  return url;
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(cell.trim().replace(/^"|"$/g, ""));
      cell = "";
    } else {
      cell += char;
    }
  }
  result.push(cell.trim().replace(/^"|"$/g, ""));
  return result;
}

export const getProducts = async (): Promise<Product[]> => {
  try {
    const response = await fetch(GOOGLE_SHEETS_CSV_URL);
    if (!response.ok) throw new Error("Error al consultar el CSV");

    const csvText = await response.text();
    const lines = csvText.split(/\r?\n/).filter((line) => line.trim() !== "");

    if (lines.length <= 1) return sampleProducts;

    let delimiter = ",";
    if (lines[0].includes("\t")) delimiter = "\t";
    else if (lines[0].includes(";")) delimiter = ";";

    const rawHeaders = parseCSVLine(lines[0], delimiter);
    const headers = rawHeaders.map((h) =>
      h.toLowerCase().trim().replace(/[^a-z0-9]/g, "")
    );

    const products: Product[] = [];

    lines.slice(1).forEach((line, index) => {
      if (line.includes("<script>") || line.includes("function(")) return;

      const values = parseCSVLine(line, delimiter);
      const rowData: Record<string, string> = {};

      headers.forEach((header, i) => {
        rowData[header] = values[i] || "";
      });

      const findVal = (keys: string[]) => {
        for (const k of keys) {
          if (rowData[k]) return rowData[k];
        }
        return "";
      };

      const name = findVal(["name", "nombre", "product", "producto"]) || values[1];
      const description = findVal(["description", "descripcion", "detalle"]) || values[2] || "";
      
      // Sanitizamos el precio crudo que viene desde la hoja de cálculo
      const rawPrice = findVal(["price", "precio", "valor"]) || values[3] || "0";
      const price = parsePrice(rawPrice);

      const type = findVal(["type", "tipo", "categoria"]) || values[4] || "tradicional";
      const rawImage = findVal(["image", "imagen", "foto"]) || values[5] || "/placeholder.jpg";
      const image = getDirectDriveImageUrl(rawImage);

      if (name) {
        products.push({
          id: findVal(["id"]) || values[0] || String(index + 1),
          name,
          description,
          price,
          type,
          image,
        });
      }
    });

    return products.length > 0 ? products : sampleProducts;
  } catch (error) {
    console.error("Error al obtener productos desde Google Sheets:", error);
    return sampleProducts;
  }
};