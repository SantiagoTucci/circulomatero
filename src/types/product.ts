export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  type: string;
  subcategory?: string;
  cat1?: string;
  cat2?: string;
  cat3?: string;
  image: string;
  images?: string[];
}