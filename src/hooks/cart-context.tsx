"use client"

import { createContext, useContext, useReducer, useEffect, ReactNode } from "react";
import { Product } from "@/types/product";
import { parsePrice } from "@/lib/parse-price";

interface CartItem extends Product {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  timestamp: number; 
}

type CartAction =
  | { type: "ADD_ITEM"; payload: Product }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "CLEAR_CART" }
  | { type: "TOGGLE_CART" }
  | { type: "SET_CART_OPEN"; payload: boolean }
  | { type: "LOAD_CART"; payload: CartState };

const EXPIRATION_TIME = 20 * 60 * 1000;


const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "ADD_ITEM": {
      // Normalizamos el precio a número puro antes de meterlo al estado
      const sanitizedProduct = {
        ...action.payload,
        price: parsePrice(action.payload.price)
      };

      const existingItem = state.items.find(item => item.id === sanitizedProduct.id);
      const updatedItems = existingItem
        ? state.items.map(item =>
            item.id === sanitizedProduct.id ? { ...item, quantity: item.quantity + 1 } : item
          )
        : [...state.items, { ...sanitizedProduct, quantity: 1 }];

      return { ...state, items: updatedItems, timestamp: Date.now() };
    }
    case "UPDATE_QUANTITY": {
      const updatedItems =
        action.payload.quantity === 0
          ? state.items.filter(item => item.id !== action.payload.id)
          : state.items.map(item =>
              item.id === action.payload.id ? { ...item, quantity: action.payload.quantity } : item
            );
      return { ...state, items: updatedItems, timestamp: Date.now() };
    }
    case "REMOVE_ITEM":
      return { ...state, items: state.items.filter(item => item.id !== action.payload), timestamp: Date.now() };
    case "CLEAR_CART":
      return { ...state, items: [], timestamp: Date.now() };
    case "TOGGLE_CART":
      return { ...state, isOpen: !state.isOpen };
    case "SET_CART_OPEN":
      return { ...state, isOpen: action.payload };
    case "LOAD_CART":
      return action.payload;
    default:
      return state;
  }
};

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: Product) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  getTotal: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const encrypt = (data: any) => btoa(JSON.stringify(data));
const decrypt = (data: string) => JSON.parse(atob(data));

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], isOpen: false, timestamp: Date.now() });

  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        const parsedCart: CartState = decrypt(savedCart);
        const now = Date.now();
        if (now - parsedCart.timestamp < EXPIRATION_TIME) {
          dispatch({ type: "LOAD_CART", payload: parsedCart });
        } else {
          localStorage.removeItem("cart");
        }
      } catch {
        localStorage.removeItem("cart");
      }
    }
  }, []);

  useEffect(() => {
    try {
      const encrypted = encrypt(state);
      localStorage.setItem("cart", encrypted);
    } catch (error) {
      console.error("Failed to save cart:", error);
    }
  }, [state]);

  const addItem = (product: Product) => dispatch({ type: "ADD_ITEM", payload: product });
  const updateQuantity = (id: string, quantity: number) => dispatch({ type: "UPDATE_QUANTITY", payload: { id, quantity } });
  const removeItem = (id: string) => dispatch({ type: "REMOVE_ITEM", payload: id });
  const clearCart = () => dispatch({ type: "CLEAR_CART" });
  const toggleCart = () => dispatch({ type: "TOGGLE_CART" });
  const openCart = () => dispatch({ type: "SET_CART_OPEN", payload: true });
  const closeCart = () => dispatch({ type: "SET_CART_OPEN", payload: false });

  // Asegura la suma correcta
  const getTotal = () =>
    state.items.reduce((total, item) => total + (parsePrice(item.price) * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      items: state.items,
      isOpen: state.isOpen,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      toggleCart,
      openCart,
      closeCart,
      getTotal
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}