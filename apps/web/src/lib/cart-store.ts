import { create } from 'zustand';

export interface CartItem {
  id: string;
  slug: string;
  title: string;
  price: number;
  thumbnail: string | null;
  tierId: string | null;
  tierName: string | null;
  qty: number;
}

interface CartState {
  items: CartItem[];
  // tierId/tierName phân biệt gói license khi chọn mua
  addItem: (
    product: Partial<CartItem> &
      Pick<CartItem, 'id' | 'slug' | 'title' | 'price' | 'thumbnail'>,
    qty?: number
  ) => void;
  removeItem: (id: string, tierId?: string | null) => void;
  clear: () => void;
  totalItems: () => number;
  updateQty: (id: string, qty: number, tierId?: string | null) => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem: (product, qty = 1) => {
    set((state) => {
      // Cùng sản phẩm nhưng gói license khác nhau => 2 dòng riêng biệt
      const lineKey = (item: CartItem) =>
        `${item.id}::${item.tierId ?? ''}`;
      const targetKey = `${product.id}::${product.tierId ?? ''}`;
      const existingItem = state.items.find(
        (item) => lineKey(item) === targetKey,
      );
      if (existingItem) {
        return {
          items: state.items.map((item) =>
            lineKey(item) === targetKey
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
              tierId: product.tierId ?? null,
              tierName: product.tierName ?? null,
            } as CartItem,
          ],
        };
      }
    });
  },
  removeItem: (id, tierId = null) => {
    set((state) => ({
      items: state.items.filter(
        (item) => !(item.id === id && (item.tierId ?? null) === (tierId ?? null)),
      ),
    }));
  },
  clear: () => {
    set({ items: [] });
  },
  totalItems: () => {
    return get().items.reduce((sum, item) => sum + item.qty, 0);
  },
  updateQty: (id, qty, tierId = null) => {
    set((state) => {
      const existingItem = state.items.find(
        (item) => item.id === id && (item.tierId ?? null) === (tierId ?? null),
      );
      if (!existingItem) return state; // item not found, do nothing
      if (qty <= 0) {
        // remove item
        return {
          items: state.items.filter(
            (item) => !(item.id === id && (item.tierId ?? null) === (tierId ?? null)),
          ),
        };
      } else {
        // update quantity
        return {
          items: state.items.map((item) =>
            item.id === id && (item.tierId ?? null) === (tierId ?? null)
              ? { ...item, qty }
              : item
          ),
        };
      }
    });
  },
}));