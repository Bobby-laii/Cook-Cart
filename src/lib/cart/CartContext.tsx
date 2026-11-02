"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface CartItemType {
  id: string;
  productId: string;
  name: string;
  nameZh?: string;
  price: number;
  unit: string;
  quantity: number;
  storeId: string;
  storeName: string;
  storeNameZh?: string;
}

interface CartContextType {
  items: CartItemType[];
  addItem: (item: CartItemType) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  itemCount: 0,
  subtotal: 0,
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItemType[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("cookcart_cart");
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load cart from storage", e);
    }
  }, []);

  const saveItems = (newItems: CartItemType[]) => {
    setItems(newItems);
    try {
      localStorage.setItem("cookcart_cart", JSON.stringify(newItems));
    } catch (e) {
      console.error("Failed to save cart to storage", e);
    }
  };

  const addItem = (item: CartItemType) => {
    const existingIndex = items.findIndex((i) => i.productId === item.productId);
    if (existingIndex > -1) {
      const updated = [...items];
      updated[existingIndex].quantity += item.quantity;
      saveItems(updated);
    } else {
      saveItems([...items, item]);
    }
  };

  const removeItem = (productId: string) => {
    saveItems(items.filter((i) => i.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
    } else {
      saveItems(
        items.map((i) => (i.productId === productId ? { ...i, quantity } : i))
      );
    }
  };

  const clearCart = () => {
    saveItems([]);
  };

  const itemCount = items.reduce((acc, curr) => acc + curr.quantity, 0);
  const subtotal = items.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotal }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
