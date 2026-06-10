import { create } from 'zustand';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface CartItem {
  id: number;
  product_id: number;
  variant_id?: number | null;
  color_name?: string | null;
  storage_label?: string | null;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  image: string;
  brand: string;
}

interface CartState {
  items: CartItem[];
  total: number;
  loading: boolean;
  fetchCart: () => Promise<void>;
  addToCart: (product_id: number, quantity?: number, variant_id?: number, color_name?: string) => Promise<void>;
  updateItem: (id: number, quantity: number) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  total: 0,
  loading: false,

  fetchCart: async () => {
    try {
      const { data } = await api.get('/cart');
      set({ items: data.data.items, total: data.data.total });
    } catch {
      set({ items: [], total: 0 });
    }
  },

  addToCart: async (product_id, quantity = 1, variant_id, color_name) => {
    try {
      await api.post('/cart', { product_id, quantity, variant_id, color_name });
      toast.success('Đã thêm vào giỏ hàng!');
      get().fetchCart();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Thêm vào giỏ hàng thất bại');
    }
  },

  updateItem: async (id, quantity) => {
    try {
      await api.put(`/cart/${id}`, { quantity });
      get().fetchCart();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại');
    }
  },

  removeItem: async (id) => {
    try {
      await api.delete(`/cart/${id}`);
      toast.success('Đã xóa khỏi giỏ hàng');
      get().fetchCart();
    } catch {
      toast.error('Xóa thất bại');
    }
  },

  clearCart: async () => {
    try {
      await api.delete('/cart/clear');
      set({ items: [], total: 0 });
    } catch {}
  },
}));
