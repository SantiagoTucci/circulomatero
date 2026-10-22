/// <reference types="@cloudflare/workers-types" />

export interface Env {
  PRODUCTS_CACHE: KVNamespace;
  SHEETS_CSV_URL: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // 1. Manejo exclusivo de la API de Productos
    if (url.pathname === "/api/products" || url.pathname === "/api/products.json") {
      return await handleProductsApi(env, ctx);
    }

    // 2. Proxy de Imágenes para almacenar en Edge Cache (Cloudflare)
    if (url.pathname === "/api/image-proxy") {
      return await handleImageProxy(request, ctx);
    }

    // 3. Si no coincide con ninguna ruta API, retorna 404 para que Cloudflare sirva los activos estáticos
    return new Response("Not Found", { status: 404 });
  },

  // 4. Cron Trigger cada 10 minutos
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      (async () => {
        try {
          const sheetUrl =
            env.SHEETS_CSV_URL ||
            "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ4RhFNa0snHZSD8lSJVpAs9hL6H52fKzcy7xMsrVX9ZJygwwYtSyzWK4rRbYCEjghbPXVzsZICcF0K/pub?output=csv";

          const products = await fetchProductsFromSheets(sheetUrl);

          if (products && products.length > 0) {
            await env.PRODUCTS_CACHE.put("products", JSON.stringify(products), {
              expirationTtl: 3600,
              metadata: { updated: Date.now() },
            });
          }
        } catch (cronError) {
          console.error("Error actualizando caché en Cron:", cronError);
        }
      })()
    );
  },
};

// --- HANDLERS ---

async function handleProductsApi(env: Env, ctx: ExecutionContext): Promise<Response> {
  let cachedProducts: string | null = null;

  try {
    if (env.PRODUCTS_CACHE) {
      cachedProducts = await env.PRODUCTS_CACHE.get("products");
    }
  } catch (kvError) {
    console.error("Error leyendo de KV:", kvError);
  }

  if (!cachedProducts) {
    try {
      const sheetUrl =
        env.SHEETS_CSV_URL ||
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ4RhFNa0snHZSD8lSJVpAs9hL6H52fKzcy7xMsrVX9ZJygwwYtSyzWK4rRbYCEjghbPXVzsZICcF0K/pub?output=csv";

      const products = await fetchProductsFromSheets(sheetUrl);
      cachedProducts = JSON.stringify(products);

      if (env.PRODUCTS_CACHE && products.length > 0) {
        ctx.waitUntil(
          env.PRODUCTS_CACHE.put("products", cachedProducts, {
            expirationTtl: 3600,
            metadata: { updated: Date.now() },
          })
        );
      }
    } catch {
      cachedProducts = JSON.stringify([]);
    }
  }

  return new Response(cachedProducts, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300, s-maxage=600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

async function handleImageProxy(request: Request, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  const imageUrl = url.searchParams.get("url");

  if (!imageUrl) {
    return new Response("Parámetro 'url' requerido", { status: 400 });
  }

  const cacheKey = new Request(imageUrl, request);
  const cache = caches.default;

  // Buscar en la memoria caché Edge de Cloudflare
  let response = await cache.match(cacheKey);

  if (!response) {
    try {
      const originResponse = await fetch(imageUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      if (!originResponse.ok) {
        return new Response("Error al obtener la imagen de origen", { status: originResponse.status });
      }

      // Crear respuesta con encabezados de caché inmutable (1 año)
      response = new Response(originResponse.body, originResponse);
      response.headers.set("Cache-Control", "public, max-age=31536000, immutable");
      response.headers.set("Access-Control-Allow-Origin", "*");

      // Almacenar en la Edge Cache de Cloudflare en segundo plano
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
    } catch (err: any) {
      return new Response(`Error en el proxy de imágenes: ${err.message}`, { status: 500 });
    }
  }

  return response;
}

// --- PARSER DE SHEETS Y HELPERS ---

async function fetchProductsFromSheets(csvUrl: string): Promise<any[]> {
  const response = await fetch(csvUrl);
  if (!response.ok) throw new Error(`HTTP Error Sheets: ${response.status}`);

  const csvText = await response.text();
  if (!csvText || !csvText.trim()) return [];

  const rows = parseCSV(csvText);
  if (rows.length <= 1) return [];

  const headers = rows[0].map(normalizeHeader);

  const idIdx = headers.findIndex((h) => h === "id" || h === "codigo");
  const nameIdx = headers.findIndex((h) => h === "nombre" || h === "name" || h === "producto");
  const descIdx = headers.findIndex((h) => h === "descripcion" || h === "description" || h === "detalle");
  const priceIdx = headers.findIndex((h) => h === "precio" || h === "price" || h === "valor");
  const cat1Idx = headers.findIndex((h) => h === "categoria1" || h === "1racategoria" || h === "1acategoria");
  const cat2Idx = headers.findIndex((h) => h === "categoria2" || h === "2dacategoria" || h === "2acategoria");
  const cat3Idx = headers.findIndex((h) => h === "categoria3" || h === "3tacategoria" || h === "3racategoria");
  const imgIdx = headers.findIndex((h) => h === "imagen" || h === "images" || h === "imagenes");

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
    } catch {
      // Ignorar fila corrupta individualmente
    }
  });

  return products;
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

function normalizeHeader(header: string): string {
  return String(header ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function parsePrice(priceStr: string): number {
  if (!priceStr) return 0;
  const cleaned = String(priceStr).replace(/[$\s.]/g, "").replace(/,/g, ".");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
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

function getDirectDriveImageUrl(url: string): string {
  if (!url) return "/placeholder.svg";
  const cleanUrl = url.trim();
  const driveIdMatch =
    cleanUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || cleanUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);

  if (driveIdMatch?.[1]) {
    const rawDriveUrl = `https://drive.google.com/thumbnail?id=${driveIdMatch[1]}&sz=w400`;
    // Pasa la imagen por el proxy de caché de Cloudflare
    return `/api/image-proxy?url=${encodeURIComponent(rawDriveUrl)}`;
  }

  if (!cleanUrl.startsWith("/") && !cleanUrl.startsWith("http")) {
    return `/${cleanUrl}`;
  }

  return cleanUrl;
}