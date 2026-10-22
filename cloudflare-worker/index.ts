/// <reference types="@cloudflare/workers-types" />

type Env = {
  PRODUCTS_CACHE: KVNamespace;
  SHEETS_CSV_URL: string;
};

export type ScheduledEvent = {
  scheduledTime: number;
  cron: string;
};

export type ExecutionContext = {
  waitUntil(promise: Promise<unknown>): void;
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Endpoint para obtener productos
    if (url.pathname === "/api/products.json") {
      try {
        // Intentar obtener de KV
        const cached = await env.PRODUCTS_CACHE.get("products", "json");
        
        if (cached) {
          return new Response(JSON.stringify(cached), {
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=300, s-maxage=600",
              "Access-Control-Allow-Origin": "*",
            },
          });
        }

        // Si no hay caché, hacer fetch en tiempo real (fallback)
        const products = await fetchProductsFromSheets(env.SHEETS_CSV_URL);
        
        return new Response(JSON.stringify(products), {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=60, s-maxage=300",
            "Access-Control-Allow-Origin": "*",
          },
        });
      } catch (error) {
        console.error("Error fetching products:", error);
        return new Response(JSON.stringify({ error: "Failed to fetch products" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Servir assets estáticos (para Cloudflare Pages)
    return new Response("Not found", { status: 404 });
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    try {
      console.log("Updating products cache from Google Sheets");
      
      const products = await fetchProductsFromSheets(env.SHEETS_CSV_URL);
      
      if (products.length > 0) {
        // Guardar en KV con metadata de timestamp
        await env.PRODUCTS_CACHE.put("products", JSON.stringify(products), {
          metadata: { updated: Date.now() },
        });
        console.log(`Cached ${products.length} products successfully`);
      } else {
        console.error("No products fetched, keeping existing cache");
      }
    } catch (error) {
      console.error("Error updating products cache:", error);
      // No reemplazar caché si falla
    }
  },
};

async function fetchProductsFromSheets(csvUrl: string): Promise<any[]> {
  const response = await fetch(csvUrl);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch CSV: ${response.status}`);
  }

  const csvText = await response.text();
  if (!csvText.trim()) {
    return [];
  }

  const rows = parseCSV(csvText);
  if (rows.length <= 1) {
    return [];
  }

  const headers = rows[0].map(normalizeHeader);
  
  const idIdx = headers.findIndex(h => h === "id" || h === "codigo");
  const nameIdx = headers.findIndex(h => h === "nombre" || h === "name" || h === "producto");
  const descIdx = headers.findIndex(h => h === "descripcion" || h === "description" || h === "detalle");
  const priceIdx = headers.findIndex(h => h === "precio" || h === "price" || h === "valor");
  const cat1Idx = headers.findIndex(h => h === "categoria1" || h === "1racategoria" || h === "1acategoria");
  const cat2Idx = headers.findIndex(h => h === "categoria2" || h === "2dacategoria" || h === "2acategoria");
  const cat3Idx = headers.findIndex(h => h === "categoria3" || h === "3tacategoria" || h === "3racategoria");
  const imgIdx = headers.findIndex(h => h === "imagen" || h === "images" || h === "imagenes");

  const products: any[] = [];

  rows.slice(1).forEach((values, index) => {
    try {
      if (values.every((val: string) => !String(val ?? "").trim())) return;

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
        const foundUrl = values.find((v: string) => v.includes("http") || v.includes("drive.google"));
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
      console.error(`Error processing row ${index + 2}:`, rowError);
    }
  });

  return products.length > 0 ? products : [];
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
  return header
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function parsePrice(priceStr: string): number {
  if (!priceStr) return 0;
  
  const cleaned = priceStr
    .replace(/[$\s.]/g, "")
    .replace(/,/g, ".");
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
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

function getDirectDriveImageUrl(url: string): string {
  if (!url) return "/placeholder.svg";

  const cleanUrl = url.trim();
  const driveIdMatch =
    cleanUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) ||
    cleanUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);

  if (driveIdMatch?.[1]) {
    const fileId = driveIdMatch[1];
    // Usar tamaño más pequeño por defecto (600px), el frontend manejará srcset
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w600`;
  }

  if (!cleanUrl.startsWith("/") && !cleanUrl.startsWith("http")) {
    return `/${cleanUrl}`;
  }

  return cleanUrl;
}

