export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  type: string;
  subcategory?: string;
  image: string;
  images?: string[];
}