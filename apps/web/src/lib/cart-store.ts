import { create } from 'zustand';

export interface CartItem {
  id: string;
  slug: string;
  title: string;
  price: number;
  thumbnail: string | null;
  qty: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Partial<CartItem> & Pick<CartItem, 'id' | 'slug' | 'title' | 'price' | 'thumbnail'>, qty?: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  totalItems: () => number;
  updateQty: (id: string, qty: number) => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem: (product, qty = 1) => {
    set((state) => {
      const existingItem = state.items.find((item) => item.id === product.id);
      if (existingItem) {
        return {
          items: state.items.map((item) =>
            item.id === product.id
              ? { ...item, qty: item.qty + qty }
              : item
          ),
        };
      } else {
        return {
          items: [
            ...state.items,
            {
              ...product,
              qty,
              thumbnail: product.thumbnail ?? null,
            } as CartItem,
          ],
        };
      }
    });
  },
  removeItem: (id) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    }));
  },
  clear: () => {
    set({ items: [] });
  },
  totalItems: () => {
    return get().items.reduce((sum, item) => sum + item.qty, 0);
  },
  updateQty: (id, qty) => {
    set((state) => {
      const existingItem = state.items.find((item) => item.id === id);
      if (!existingItem) return state; // item not found, do nothing
      if (qty <= 0) {
        // remove item
        return {
          items: state.items.filter((item) => item.id !== id),
        };
      } else {
        // update quantity
        return {
          items: state.items.map((item) =>
            item.id === id ? { ...item, qty } : item
          ),
        };
      }
    });
  },
}));