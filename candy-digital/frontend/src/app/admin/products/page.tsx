'use client';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Upload, Sparkles, ListTree } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/format';
import { resolveMediaUrl } from '@/lib/media';

interface Product {
  id: number; name: string; price: number; stock: number;
  brand: string; is_active: number; category_id?: number | null; category_name: string; description?: string; image?: string; slug: string;
  display_price?: number; display_stock?: number; storage_count?: number; color_count?: number;
}

interface ColorRow {
  name: string;
  hex_code: string;
  is_active: string;
  image_url: string | null;
  pending_file?: File | null;
  preview?: string | null;
}
interface StorageRow { label: string; price: string; stock: string; is_active: string }
interface SpecItem { label: string; value: string }
interface SpecGroup { group: string; items: SpecItem[] }

const EMPTY_FORM = {
  category_id: '', name: '', description: '', short_description: '',
  price: '', stock: '', brand: '', warranty: '12 tháng', origin: 'Chính hãng VN/A',
  is_active: '1',
};
const EMPTY_COLOR: ColorRow = { name: '', hex_code: '#000000', is_active: '1', image_url: null, pending_file: null, preview: null };
const EMPTY_STORAGE: StorageRow = { label: '', price: '', stock: '', is_active: '1' };

const SUGGESTED_GROUPS = [
  'Cấu hình & Bộ nhớ',
  'Camera & Màn hình',
  'Pin & Sạc',
  'Tiện ích',
  'Kết nối',
  'Thiết kế & Chất liệu',
  'Thông tin chung',
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [files, setFiles] = useState<FileList | null>(null);
  const [saving, setSaving] = useState(false);
  const [colors, setColors] = useState<ColorRow[]>([]);
  const [storage, setStorage] = useState<StorageRow[]>([]);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [specs, setSpecs] = useState<SpecGroup[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const imgBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

  useEffect(() => {
    api.get('/categories/admin/list').then(({ data }) => setCategories(data.data));
  }, []);

  useEffect(() => { fetchProducts(); }, [search, page]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (search) params.set('search', search);
      const { data } = await api.get(`/products/admin/list?${params}`);
      setProducts(data.data);
      setTotal(data.pagination.total);
    } catch { } finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFiles(null);
    setColors([]);
    setStorage([]);
    setHighlights([]);
    setSpecs([]);
    setModal(true);
  };

  const openEdit = async (p: Product) => {
    setEditing(p);
    try {
      const { data } = await api.get(`/products/admin/detail/${p.id}`);
      const item = data.data;
      setForm({
        category_id: item.category_id ? String(item.category_id) : '',
        name: item.name,
        description: item.description || '',
        short_description: item.short_description || '',
        price: String(item.price),
        stock: String(item.stock),
        brand: item.brand || '',
        warranty: item.warranty || '12 tháng',
        origin: item.origin || 'Chính hãng VN/A',
        is_active: String(item.is_active),
      });
      setColors((item.colors || []).map((c: any) => ({
        name: c.name,
        hex_code: c.hex_code || '#000000',
        is_active: String(c.is_active ?? 1),
        image_url: c.image_url || null,
        pending_file: null,
        preview: c.image_url ? resolveMediaUrl(c.image_url, imgBase) : null,
      })));
      setStorage((item.storage_options || []).map((s: any) => ({
        label: s.storage_label,
        price: String(s.price),
        stock: String(s.stock),
        is_active: String(s.is_active ?? 1),
      })));
      setHighlights(Array.isArray(item.highlights) ? item.highlights : []);
      setSpecs(Array.isArray(item.specifications) ? item.specifications : []);
      setFiles(null);
      setModal(true);
    } catch {
      toast.error('Không tải được chi tiết sản phẩm');
    }
  };

  const handleColorImage = (idx: number, file: File | null) => {
    setColors((prev) => prev.map((c, i) => {
      if (i !== idx) return c;
      if (!file) return { ...c, pending_file: null };
      return {
        ...c,
        pending_file: file,
        preview: URL.createObjectURL(file),
      };
    }));
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.stock) { toast.error('Vui lòng điền đầy đủ thông tin cơ bản'); return; }

    const cleanedColors = colors.filter((c) => c.name.trim());
    const cleanedStorage = storage.filter((s) => s.label.trim() && s.price !== '' && s.stock !== '');

    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));

      const colorImageFiles: File[] = [];
      const colorsPayload = cleanedColors.map((c) => {
        let imageIndex: number | null = null;
        if (c.pending_file) {
          imageIndex = colorImageFiles.length;
          colorImageFiles.push(c.pending_file);
        }
        return {
          name: c.name.trim(),
          hex_code: c.hex_code.trim() || null,
          is_active: Number(c.is_active),
          image_url: imageIndex === null ? c.image_url : null,
          image_index: imageIndex,
        };
      });

      fd.append('colors_json', JSON.stringify(colorsPayload));
      fd.append('storage_json', JSON.stringify(
        cleanedStorage.map((s) => ({
          label: s.label.trim(),
          price: Number(s.price),
          stock: Number(s.stock),
          is_active: Number(s.is_active),
        }))
      ));
      fd.append('highlights_json', JSON.stringify(highlights.filter((h) => h.trim()).map((h) => h.trim())));
      fd.append('specifications_json', JSON.stringify(
        specs
          .map((g) => ({
            group: g.group.trim(),
            items: g.items
              .filter((it) => it.label.trim() && it.value.trim())
              .map((it) => ({ label: it.label.trim(), value: it.value.trim() })),
          }))
          .filter((g) => g.group && g.items.length > 0)
      ));

      if (files) Array.from(files).forEach(f => fd.append('images', f));
      colorImageFiles.forEach((f) => fd.append('color_images', f));

      if (editing) {
        await api.put(`/products/admin/${editing.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Cập nhật thành công');
      } else {
        await api.post('/products/admin/create', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Tạo sản phẩm thành công');
      }
      setModal(false);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Thất bại');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa sản phẩm này?')) return;
    try {
      await api.delete(`/products/admin/${id}`);
      toast.success('Đã xóa sản phẩm');
      fetchProducts();
    } catch { toast.error('Xóa thất bại'); }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Quản lý sản phẩm</h1>
          <p className="text-sm text-gray-500">Tổng {total} sản phẩm</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 px-4 py-2.5">
          <Plus size={16} /> Thêm sản phẩm
        </button>
      </div>

      <div className="card p-3 mb-4 flex gap-2">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Tìm kiếm sản phẩm..." className="input-field flex-1" />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Sản phẩm', 'Danh mục', 'Giá', 'Tồn kho', 'Trạng thái', 'Thao tác'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
                ))
              ) : products.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-base flex-shrink-0 overflow-hidden border border-gray-100">
                        {p.image ? (
                          <img src={resolveMediaUrl(p.image, imgBase)} alt={p.name} className="w-full h-full object-contain p-0.5" />
                        ) : (
                          <span className="text-gray-400">📱</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-sm line-clamp-1">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{p.category_name || '—'}</td>
                  <td className="px-4 py-3 text-primary font-medium">{formatCurrency(p.display_price ?? p.price)}</td>
                  <td className="px-4 py-3">
                    <span className={(p.display_stock ?? p.stock) < 5 ? 'text-orange-600 font-medium' : 'text-gray-700'}>
                      {p.display_stock ?? p.stock}
                    </span>
                    {((p.color_count || 0) > 0 || (p.storage_count || 0) > 0) && (
                      <p className="text-[11px] text-gray-400">
                        {p.color_count || 0} màu · {p.storage_count || 0} dung lượng
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={p.is_active ? 'badge-status-done' : 'badge-status-cancelled'}>
                      {p.is_active ? 'Đang bán' : 'Tạm ẩn'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary-50 rounded-lg transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {total > 15 && (
        <div className="flex justify-center gap-2 mt-4">
          {[...Array(Math.ceil(total / 15))].map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
              className={`w-8 h-8 rounded-lg text-xs font-medium ${page === i + 1 ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-semibold text-gray-800">{editing ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-5">
              {/* BASIC */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Danh mục</label>
                  <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} className="input-field">
                    <option value="">Chọn danh mục</option>
                    {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Thương hiệu</label>
                  <input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} className="input-field" placeholder="Apple, Samsung..." />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Tên sản phẩm *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="iPhone 15 Pro Max" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Mô tả ngắn (hiển thị dưới tên)</label>
                <input value={form.short_description} onChange={e => setForm({ ...form, short_description: e.target.value })} className="input-field" placeholder="Chip A17 Pro · Camera 48MP · Khung Titan..." />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Giá mặc định (đ) *</label>
                  <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="input-field" placeholder="28990000" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Tồn kho mặc định *</label>
                  <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} className="input-field" placeholder="10" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Trạng thái</label>
                  <select value={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.value })} className="input-field">
                    <option value="1">Đang bán</option>
                    <option value="0">Tạm ẩn</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Bảo hành</label>
                  <input value={form.warranty} onChange={e => setForm({ ...form, warranty: e.target.value })} className="input-field" placeholder="12 tháng" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Xuất xứ / Loại máy</label>
                  <input value={form.origin} onChange={e => setForm({ ...form, origin: e.target.value })} className="input-field" placeholder="Chính hãng VN/A" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Mô tả chi tiết</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="input-field resize-none" rows={4} placeholder="Mô tả sản phẩm..." />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Hình ảnh chính (gallery)</label>
                <input type="file" multiple accept="image/*" onChange={e => setFiles(e.target.files)} className="input-field" />
                <p className="text-[11px] text-gray-400 mt-1">Có thể chọn nhiều ảnh để tạo gallery (ảnh đầu là ảnh chính). Tối đa 10 ảnh.</p>
              </div>

              {/* HIGHLIGHTS */}
              <div className="border border-gray-100 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-primary" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Điểm nhấn sản phẩm</p>
                      <p className="text-[11px] text-gray-400">Hiển thị dạng list ✓ phía trên nút Mua. Mỗi dòng 1 điểm nhấn</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHighlights([...highlights, ''])}
                    className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:border-primary hover:text-primary"
                  >
                    + Thêm điểm nhấn
                  </button>
                </div>
                <div className="space-y-2">
                  {highlights.map((h, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        value={h}
                        onChange={(e) => setHighlights(highlights.map((v, j) => j === i ? e.target.value : v))}
                        className="input-field flex-1"
                        placeholder="VD: Chip A17 Pro mạnh nhất trên iPhone"
                      />
                      <button
                        type="button"
                        onClick={() => setHighlights(highlights.filter((_, j) => j !== i))}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {highlights.length === 0 && (
                    <p className="text-xs text-gray-400 italic">Chưa có điểm nhấn nào.</p>
                  )}
                </div>
              </div>

              {/* COLORS */}
              <div className="border border-gray-100 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Màu sắc</p>
                    <p className="text-[11px] text-gray-400">Mỗi màu có thể upload 1 ảnh riêng (hiện khi khách chọn màu đó)</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setColors([...colors, { ...EMPTY_COLOR }])}
                    className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:border-primary hover:text-primary"
                  >
                    + Thêm màu
                  </button>
                </div>
                <div className="space-y-3">
                  {colors.map((color, idx) => (
                    <div key={idx} className="flex gap-2 items-start border border-gray-100 rounded-lg p-2 bg-gray-50/50">
                      <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-white border border-gray-200 flex items-center justify-center">
                        {color.preview ? (
                          <img src={color.preview} alt="" className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-[10px] text-gray-400 text-center px-1">Chưa có ảnh</span>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex gap-2">
                          <input
                            value={color.name}
                            onChange={(e) => setColors(colors.map((c, i) => i === idx ? { ...c, name: e.target.value } : c))}
                            className="input-field flex-1"
                            placeholder="Tên màu (Đen, Xám, Hồng...)"
                          />
                          <input
                            type="color"
                            value={color.hex_code || '#000000'}
                            onChange={(e) => setColors(colors.map((c, i) => i === idx ? { ...c, hex_code: e.target.value } : c))}
                            className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                            title="Mã màu hiển thị"
                          />
                        </div>
                        <label className="flex items-center gap-2 text-xs text-primary cursor-pointer">
                          <Upload size={12} />
                          <span className="underline">{color.preview ? 'Đổi ảnh' : 'Tải ảnh cho màu này'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleColorImage(idx, e.target.files?.[0] || null)}
                          />
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => setColors(colors.filter((_, i) => i !== idx))}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {colors.length === 0 && (
                    <p className="text-xs text-gray-400 italic">Chưa có màu nào. Bỏ trống nếu sản phẩm không có nhiều màu.</p>
                  )}
                </div>
              </div>

              {/* STORAGE */}
              <div className="border border-gray-100 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Dung lượng & Giá</p>
                    <p className="text-[11px] text-gray-400">Mỗi dung lượng có giá và tồn kho riêng</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStorage([...storage, { ...EMPTY_STORAGE }])}
                    className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:border-primary hover:text-primary"
                  >
                    + Thêm dung lượng
                  </button>
                </div>
                <div className="space-y-2">
                  {storage.map((s, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2">
                      <input
                        value={s.label}
                        onChange={(e) => setStorage(storage.map((v, i) => i === idx ? { ...v, label: e.target.value } : v))}
                        className="input-field col-span-3"
                        placeholder="128GB"
                      />
                      <input
                        type="number"
                        value={s.price}
                        onChange={(e) => setStorage(storage.map((v, i) => i === idx ? { ...v, price: e.target.value } : v))}
                        className="input-field col-span-5"
                        placeholder="Giá (đ)"
                      />
                      <input
                        type="number"
                        value={s.stock}
                        onChange={(e) => setStorage(storage.map((v, i) => i === idx ? { ...v, stock: e.target.value } : v))}
                        className="input-field col-span-3"
                        placeholder="Tồn kho"
                      />
                      <button
                        type="button"
                        onClick={() => setStorage(storage.filter((_, i) => i !== idx))}
                        className="col-span-1 text-red-500 hover:bg-red-50 rounded-lg flex items-center justify-center"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {storage.length === 0 && (
                    <p className="text-xs text-gray-400 italic">Chưa có dung lượng nào. Bỏ trống nếu sản phẩm không phân theo GB.</p>
                  )}
                </div>
              </div>

              {/* SPECIFICATIONS */}
              <div className="border border-gray-100 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ListTree size={14} className="text-primary" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Thông số kỹ thuật</p>
                      <p className="text-[11px] text-gray-400">Nhóm các thông số (giống Thế Giới Di Động): Cấu hình & Bộ nhớ, Camera & Màn hình, Pin & Sạc...</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-wrap justify-end">
                    <select
                      onChange={(e) => {
                        if (!e.target.value) return;
                        if (specs.find((g) => g.group === e.target.value)) {
                          toast.error('Nhóm này đã có');
                          return;
                        }
                        setSpecs([...specs, { group: e.target.value, items: [{ label: '', value: '' }] }]);
                        e.target.value = '';
                      }}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600"
                      defaultValue=""
                    >
                      <option value="">+ Nhóm gợi ý</option>
                      {SUGGESTED_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={() => setSpecs([...specs, { group: '', items: [{ label: '', value: '' }] }])}
                      className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:border-primary hover:text-primary"
                    >
                      + Nhóm mới
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {specs.map((group, gi) => (
                    <div key={gi} className="border border-gray-200 rounded-lg p-3 bg-white">
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          value={group.group}
                          onChange={(e) => setSpecs(specs.map((g, i) => i === gi ? { ...g, group: e.target.value } : g))}
                          className="input-field font-medium"
                          placeholder="Tên nhóm (VD: Cấu hình & Bộ nhớ)"
                        />
                        <button
                          type="button"
                          onClick={() => setSpecs(specs.filter((_, i) => i !== gi))}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg flex-shrink-0"
                          title="Xoá nhóm"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {group.items.map((it, ii) => (
                          <div key={ii} className="grid grid-cols-12 gap-2">
                            <input
                              value={it.label}
                              onChange={(e) => setSpecs(specs.map((g, i) => i === gi ? {
                                ...g,
                                items: g.items.map((x, j) => j === ii ? { ...x, label: e.target.value } : x),
                              } : g))}
                              className="input-field col-span-5"
                              placeholder="Tên thông số (Hệ điều hành)"
                            />
                            <input
                              value={it.value}
                              onChange={(e) => setSpecs(specs.map((g, i) => i === gi ? {
                                ...g,
                                items: g.items.map((x, j) => j === ii ? { ...x, value: e.target.value } : x),
                              } : g))}
                              className="input-field col-span-6"
                              placeholder="Giá trị (iOS 18)"
                            />
                            <button
                              type="button"
                              onClick={() => setSpecs(specs.map((g, i) => i === gi ? {
                                ...g, items: g.items.filter((_, j) => j !== ii),
                              } : g))}
                              className="col-span-1 text-red-400 hover:bg-red-50 rounded-lg flex items-center justify-center"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => setSpecs(specs.map((g, i) => i === gi ? {
                          ...g, items: [...g.items, { label: '', value: '' }],
                        } : g))}
                        className="text-xs text-primary mt-2 hover:underline"
                      >
                        + Thêm dòng thông số
                      </button>
                    </div>
                  ))}
                  {specs.length === 0 && (
                    <p className="text-xs text-gray-400 italic">Chưa có nhóm thông số. Chọn 1 nhóm gợi ý ở trên để bắt đầu.</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100 sticky bottom-0 bg-white">
              <button onClick={() => setModal(false)} className="btn-ghost flex-1 py-2.5">Hủy</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 py-2.5">
                {saving ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Tạo sản phẩm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
