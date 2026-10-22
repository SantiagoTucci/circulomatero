export interface Env {
  PRODUCTS_CACHE: KVNamespace;
  SHEETS_CSV_URL: string;
}

export default {
  // 1. Manejador para solicitudes HTTP del cliente (/api/products)
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Servir la API de productos
    if (url.pathname === "/api/products" || url.pathname === "/api/products.json") {
      try {
        // Intentar leer desde el KV PRODUCTS_CACHE
        let cachedProducts = await env.PRODUCTS_CACHE.get("PRODUCTS_DATA");

        // Si el KV aún no se ha poblado, hacer fallback a Google Sheets
        if (!cachedProducts) {
          const sheetUrl =
            env.SHEETS_CSV_URL ||
            "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ4RhFNa0snHZSD8lSJVpAs9hL6H52fKzcy7xMsrVX9ZJygwwYtSyzWK4rRbYCEjghbPXVzsZICcF0K/pub?output=csv";

          const res = await fetch(sheetUrl);
          if (!res.ok) throw new Error("Error obteniendo CSV de Sheets");

          const csvText = await res.text();
          const productsJson = parseCsvToJson(csvText);
          cachedProducts = JSON.stringify(productsJson);

          // Guardar en KV por 1 hora
          await env.PRODUCTS_CACHE.put("PRODUCTS_DATA", cachedProducts, { expirationTtl: 3600 });
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
          JSON.stringify({ error: "Error interno obteniendo productos", details: err.message }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    return new Response("Not Found", { status: 404 });
  },

  // 2. Cron Trigger para refrescar la caché en segundo plano cada 10 minutos
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
    console.error("Error actualizando KV desde Cron:", e);
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