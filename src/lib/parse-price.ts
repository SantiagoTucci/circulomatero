// src/lib/parse-price.ts

export const parsePrice = (priceInput: any): number => {
  if (typeof priceInput === "number") return priceInput;
  if (!priceInput) return 0;

  let str = String(priceInput).trim().replace(/\$/g, "").replace(/\s/g, "");

  // Si contiene punto y coma (ej. "10.499,00" o "10,499.00")
  if (str.includes(".") && str.includes(",")) {
    if (str.lastIndexOf(",") > str.lastIndexOf(".")) {
      str = str.replace(/\./g, "").replace(",", ".");
    } else {
      str = str.replace(/,/g, "");
    }
  } 
  // Si solo tiene comas (ej. "10,000" o "10,50")
  else if (str.includes(",")) {
    const parts = str.split(",");
    if (parts.length > 1 && parts[parts.length - 1].length === 3) {
      str = str.replace(/,/g, "");
    } else {
      str = str.replace(",", ".");
    }
  } 
  // Si solo tiene puntos (ej. "10.000")
  else if (str.includes(".")) {
    const parts = str.split(".");
    if (parts.length > 1 && parts[parts.length - 1].length === 3) {
      str = str.replace(/\./g, "");
    }
  }

  return parseFloat(str) || 0;
};