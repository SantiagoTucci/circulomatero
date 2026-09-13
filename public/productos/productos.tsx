import { Product } from "@/types/product";

// 1. Array de respaldo (fallback) por si falla la red
export const sampleProducts: Product[] = [
  // {
  //   id: "1",
  //   name: "Mate Imperial Premium",
  //   description: "Calabaza y cuero natural. Virola de acero inoxidable. Máxima calidad.",
  //   price: 12500,
  //   type: "tradicional",
  //   image: "/mate2ejemplo.jpg",
  // },
  // {
  //   id: "2",
  //   name: "Mate Criollo",
  //   description: "Clásico de madera. Resistente y realza el sabor de la yerba.",
  //   price: 9800,
  //   type: "madera",
  //   image: "/mate1ejemplo.jpg",
  // },
  // {
  //   id: "3",
  //   name: "Matera de Cuero Liso Artesanal",
  //   description: "Bolso de cuero natural con costura visible. Capacidad para termo, mate y yerbera.",
  //   price: 11200,
  //   type: "accesorio",
  //   image: "/matera3ejemplo.jpg",
  // },
  // {
  //   id: "4",
  //   name: "Mate Imperial Cincelado",
  //   description: "Calabaza premium con virola de acero inoxidable con detalle cincelado.",
  //   price: 12500,
  //   type: "tradicional",
  //   image: "/mate4ejemplo.jpg",
  // },
  // {
  //   id: "5",
  //   name: "Bombilla de Acero Inoxidable", 
  //   description: "Bombilla planas de acero inoxidable de alta calidad. Filtro removible para fácil limpieza.",
  //   price: 9800,
  //   type: "accesorio", 
  //   image: "/bombillas6ejemplo.jpg",
  // },
  // {
  //   id: "6",
  //   name: "Mate Campestre",
  //   description: "Diseño rústico. Madera y materiales únicos para una experiencia auténtica.",
  //   price: 11200,
  //   type: "cuero",
  //   image: "/mate5ejemplo.jpg",
  // },
];

// 2. URL del CSV publicado de Google Sheets
// Reemplaza esta URL por la que obtuviste en "Publicar en la web"
const GOOGLE_SHEETS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ4RhFNa0snHZSD8lSJVpAs9hL6H52fKzcy7xMsrVX9ZJygwwYtSyzWK4rRbYCEjghbPXVzsZICcF0K/pub?output=csv";

// Transformador de enlaces de Google Drive a URLs de imagen directas
function getDirectDriveImageUrl(url: string): string {
  if (!url) return "/placeholder.svg";

  // Extrae el ID único del archivo de Google Drive
  const driveIdMatch =
    url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);

  if (driveIdMatch && driveIdMatch[1]) {
    const fileId = driveIdMatch[1];
    // Usa la API de thumbnails de Google (sz=w1000 asigna calidad HD de 1000px de ancho)
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
      // Ignora líneas que contengan scripts accidentalmente
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

      const name =
        findVal(["name", "nombre", "product", "producto"]) || values[1];
      const description =
        findVal(["description", "descripcion", "detalle"]) || values[2] || "";
      const priceRaw = (
        findVal(["price", "precio", "valor"]) ||
        values[3] ||
        "0"
      ).replace(/[^0-9.]/g, "");
      const price = Number(priceRaw) || 0;
      const type =
        findVal(["type", "tipo", "categoria"]) || values[4] || "tradicional";

      const rawImage =
        findVal(["image", "imagen", "foto"]) || values[5] || "/placeholder.jpg";

      // 💥 AQUÍ SE APLICA LA CONVERSIÓN DE GOOGLE DRIVE:
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