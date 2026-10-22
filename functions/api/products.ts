export interface Env {
  PRODUCTS_CACHE: KVNamespace;
  SHEETS_CSV_URL: string;
  ASSETS: { fetch: typeof fetch }; // Binding automático de Cloudflare para archivos estáticos
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // 1. Manejador exclusivo para la API de productos
    if (url.pathname === "/api/products" || url.pathname === "/api/products.json") {
      try {
        let cachedProducts = await env.PRODUCTS_CACHE.get("PRODUCTS_DATA");

        // Fallback inmediato a Google Sheets si el KV está vacío
        if (!cachedProducts) {
          const sheetUrl =
            env.SHEETS_CSV_URL ||
            "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ4RhFNa0snHZSD8lSJVpAs9hL6H52fKzcy7xMsrVX9ZJygwwYtSyzWK4rRbYCEjghbPXVzsZICcF0K/pub?output=csv";

          const res = await fetch(sheetUrl);
          if (!res.ok) throw new Error(`Error HTTP Sheets ${res.status}`);

          const csvText = await res.text();
          const productsJson = parseCsvToJson(csvText);
          cachedProducts = JSON.stringify(productsJson);

          ctx.waitUntil(
            env.PRODUCTS_CACHE.put("PRODUCTS_DATA", cachedProducts, { expirationTtl: 3600 })
          );
        }

        return new Response(cachedProducts, {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=300, s-maxage=3600",
            "Access-Control-Allow-Origin": "*",
          },
        });
      } catch (err: any) {
        return new Response(
          JSON.stringify({ error: "Error en la API de productos", details: err.message }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // 2. Para cualquier otra ruta (como la raíz /), delega el renderizado a la carpeta ./dist
    return env.ASSETS.fetch(request);
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(refreshProductsCache(env));
  },
};

async function refreshProductsCache(env: Env) {
  try {
    const sheetUrl =
      env.SHEETS_CSV_URL ||
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ4RhFNa0snHZSD8lSJVpAs9hL6H52fKzcy7xMsrVX9ZJygwwYtSyzWK4rRbYCEjghbPXVzsZICcF0K/pub?output=csv";

    const res = await fetch(sheetUrl);
    if (!res.ok) return;

    const csvText = await res.text();
    const productsJson = parseCsvToJson(csvText);

    if (productsJson.length > 0) {
      await env.PRODUCTS_CACHE.put("PRODUCTS_DATA", JSON.stringify(productsJson), {
        expirationTtl: 3600,
      });
    }
  } catch (e) {
    console.error("Error al actualizar la caché en segundo plano:", e);
  }
}

function parseCsvToJson(csvText: string) {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length <= 1) return [];

  const headers = lines[0].split(",").map((h) =>
    h.toLowerCase().trim().replace(/[^a-z0-9]/g, "")
  );

  const products: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",");
    if (values.length < headers.length) continue;

    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = (values[idx] || "").trim();
    });

    const name = row["nombre"] || row["name"] || row["producto"] || values[1];
    const rawPrice = row["precio"] || row["price"] || values[3] || "0";
    const price = Number(rawPrice.replace(/[^0-9]/g, "")) || 0;

    if (name && price > 0) {
      products.push({
        id: row["id"] || row["codigo"] || String(i),
        name,
        description: row["descripcion"] || row["detalle"] || "",
        price,
        type: row["categoria1"] || row["1racategoria"] || "Otros",
        subcategory: row["categoria2"] || row["2dacategoria"] || "",
        cat1: row["categoria1"] || row["1racategoria"] || "Otros",
        cat2: row["categoria2"] || row["2dacategoria"] || "",
        cat3: row["categoria3"] || row["3tacategoria"] || "",
        image: row["imagen"] || row["images"] || "/placeholder.svg",
        images: (row["imagen"] || "").split(",").map((s) => s.trim()).filter(Boolean),
      });
    }
  }

  return products;
}