'use client';
import { useEffect, useMemo, useState } from 'react';
import { BadgePercent, Plus, Pencil, Trash2, X, CalendarDays, Check, Power } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';

type Scope = 'all' | 'category' | 'product';
type Status = 'running' | 'scheduled' | 'ended' | 'disabled';

interface CampaignTarget {
  target_type: 'category' | 'product';
  target_id: number;
  label?: string;
}

interface Campaign {
  id: number;
  name: string;
  slug: string;
  banner_text: string | null;
  description: string | null;
  discount_percent: number;
  starts_at: string;
  ends_at: string;
  scope: Scope;
  priority: number;
  is_active: number;
  status: Status;
  targets: CampaignTarget[];
}

interface Category { id: number; name: string }
interface Product { id: number; name: string; brand?: string }

const PRESETS: { label: string; key: string; build: () => Partial<FormState> }[] = [
  {
    label: '11.11 Single Day',
    key: '11-11',
    build: () => {
      const y = new Date().getFullYear();
      return {
        name: `Sale 11.11 ${y}`,
        slug: `sale-11-11-${y}`,
        banner_text: '11.11 · Single Day Mega Sale',
        discount_percent: '30',
        starts_at: `${y}-11-10T00:00`,
        ends_at: `${y}-11-12T23:59`,
        scope: 'all',
        priority: '110',
      };
    },
  },
  {
    label: '12.12 Year-End',
    key: '12-12',
    build: () => {
      const y = new Date().getFullYear();
      return {
        name: `Sale 12.12 ${y}`,
        slug: `sale-12-12-${y}`,
        banner_text: '12.12 · Year-End Sale',
        discount_percent: '25',
        starts_at: `${y}-12-11T00:00`,
        ends_at: `${y}-12-13T23:59`,
        scope: 'all',
        priority: '120',
      };
    },
  },
  {
    label: 'Black Friday',
    key: 'black-friday',
    build: () => {
      const y = new Date().getFullYear();
      return {
        name: `Black Friday ${y}`,
        slug: `black-friday-${y}`,
        banner_text: 'BLACK FRIDAY · Cyber Week',
        discount_percent: '35',
        starts_at: `${y}-11-24T00:00`,
        ends_at: `${y}-11-30T23:59`,
        scope: 'all',
        priority: '99',
      };
    },
  },
];

interface FormState {
  name: string;
  slug: string;
  banner_text: string;
  description: string;
  discount_percent: string;
  starts_at: string;
  ends_at: string;
  scope: Scope;
  priority: string;
  is_active: boolean;
  targets: CampaignTarget[];
}

const EMPTY_FORM: FormState = {
  name: '',
  slug: '',
  banner_text: '',
  description: '',
  discount_percent: '',
  starts_at: '',
  ends_at: '',
  scope: 'all',
  priority: '0',
  is_active: true,
  targets: [],
};

const STATUS_BADGE: Record<Status, { label: string; cls: string }> = {
  running:   { label: 'Đang chạy', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  scheduled: { label: 'Đã lên lịch', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  ended:     { label: 'Đã kết thúc', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  disabled:  { label: 'Đã tắt', cls: 'bg-rose-50 text-rose-600 border-rose-200' },
};

const SCOPE_LABEL: Record<Scope, string> = {
  all: 'Toàn shop',
  category: 'Theo danh mục',
  product: 'Theo sản phẩm',
};

const toLocalInput = (mysqlDate: string) => {
  if (!mysqlDate) return '';
  const d = new Date(mysqlDate);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const slugifyVi = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export default function AdminPromotionsPage() {
  const [items, setItems] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    fetchAll();
    api.get('/categories/admin/list').then(({ data }) => setCategories(data.data)).catch(() => {});
    api.get('/products/admin/list?limit=200').then(({ data }) => setProducts(data.data)).catch(() => {});
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/promotions/admin/list');
      setItems(data.data);
    } catch {
      toast.error('Không tải được danh sách chiến dịch');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const running = items.filter((i) => i.status === 'running').length;
    const scheduled = items.filter((i) => i.status === 'scheduled').length;
    const ended = items.filter((i) => i.status === 'ended').length;
    const disabled = items.filter((i) => i.status === 'disabled').length;
    return { running, scheduled, ended, disabled, total: items.length };
  }, [items]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModal(true);
  };

  const openEdit = (c: Campaign) => {
    setEditing(c);
    setForm({
      name: c.name,
      slug: c.slug,
      banner_text: c.banner_text || '',
      description: c.description || '',
      discount_percent: String(c.discount_percent),
      starts_at: toLocalInput(c.starts_at),
      ends_at: toLocalInput(c.ends_at),
      scope: c.scope,
      priority: String(c.priority),
      is_active: !!c.is_active,
      targets: c.targets.map((t) => ({ target_type: t.target_type, target_id: t.target_id })),
    });
    setModal(true);
  };

  const closeModal = () => {
    setModal(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const applyPreset = (key: string) => {
    const preset = PRESETS.find((p) => p.key === key);
    if (!preset) return;
    setForm((prev) => ({ ...prev, ...preset.build() } as FormState));
  };

  const toggleTarget = (target_type: 'category' | 'product', target_id: number) => {
    setForm((prev) => {
      const exists = prev.targets.some((t) => t.target_type === target_type && t.target_id === target_id);
      const targets = exists
        ? prev.targets.filter((t) => !(t.target_type === target_type && t.target_id === target_id))
        : [...prev.targets, { target_type, target_id }];
      return { ...prev, targets };
    });
  };

  const isTargetChecked = (target_type: 'category' | 'product', target_id: number) =>
    form.targets.some((t) => t.target_type === target_type && t.target_id === target_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug || slugifyVi(form.name),
        banner_text: form.banner_text || null,
        description: form.description || null,
        discount_percent: Number(form.discount_percent),
        starts_at: form.starts_at,
        ends_at: form.ends_at,
        scope: form.scope,
        priority: Number(form.priority) || 0,
        is_active: form.is_active ? 1 : 0,
        targets: form.scope === 'all' ? [] : form.targets,
      };
      if (editing) {
        await api.put(`/promotions/admin/${editing.id}`, payload);
        toast.success('Đã cập nhật chiến dịch');
      } else {
        await api.post('/promotions/admin', payload);
        toast.success('Đã tạo chiến dịch mới');
      }
      closeModal();
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: Campaign) => {
    if (!confirm(`Xoá chiến dịch "${c.name}"? Hành động này không thể hoàn tác.`)) return;
    try {
      await api.delete(`/promotions/admin/${c.id}`);
      toast.success('Đã xoá chiến dịch');
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Xoá thất bại');
    }
  };

  const handleToggle = async (c: Campaign) => {
    try {
      await api.put(`/promotions/admin/${c.id}/toggle`);
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không cập nhật được trạng thái');
    }
  };

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products.slice(0, 60);
    const q = productSearch.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q)).slice(0, 60);
  }, [products, productSearch]);

  return (
    <AdminLayout>
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <BadgePercent size={20} className="text-primary" /> Chiến dịch khuyến mãi
          </h1>
          <p className="text-sm text-gray-500">
            Cấu hình các đợt giảm giá theo % từ database. Hệ thống tự động áp dụng khi sản phẩm thuộc phạm vi và còn trong khung thời gian.
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary inline-flex items-center gap-2 self-start md:self-auto">
          <Plus size={16} /> Tạo chiến dịch
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        {[
          { label: 'Tổng', value: stats.total, color: 'text-gray-700' },
          { label: 'Đang chạy', value: stats.running, color: 'text-emerald-600' },
          { label: 'Lên lịch', value: stats.scheduled, color: 'text-blue-600' },
          { label: 'Đã kết thúc', value: stats.ended, color: 'text-gray-500' },
          { label: 'Đã tắt', value: stats.disabled, color: 'text-rose-500' },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-gray-50">
              <tr>
                {['Tên chiến dịch', 'Phạm vi', '% giảm', 'Khung thời gian', 'Trạng thái', 'Thao tác'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">Đang tải...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                  Chưa có chiến dịch nào. Bấm "Tạo chiến dịch" để bắt đầu.
                </td></tr>
              ) : (
                items.map((c) => {
                  const badge = STATUS_BADGE[c.status];
                  return (
                    <tr key={c.id} className="hover:bg-gray-50/70">
                      <td className="px-4 py-3 align-top">
                        <p className="font-semibold text-gray-800">{c.name}</p>
                        {c.banner_text && <p className="text-xs text-gray-500 mt-0.5">{c.banner_text}</p>}
                        <p className="text-[11px] text-gray-400 mt-0.5">slug: {c.slug} · ưu tiên {c.priority}</p>
                      </td>
                      <td className="px-4 py-3 align-top text-gray-600">
                        <p>{SCOPE_LABEL[c.scope]}</p>
                        {c.scope !== 'all' && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {c.targets.slice(0, 3).map((t) => (
                              <span key={`${t.target_type}-${t.target_id}`} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
                                {t.label}
                              </span>
                            ))}
                            {c.targets.length > 3 && (
                              <span className="text-[10px] text-gray-400">+{c.targets.length - 3}</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span className="rounded-md bg-rose-50 px-2 py-1 text-rose-600 font-bold">
                          −{Math.round(Number(c.discount_percent))}%
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top text-gray-600 text-xs">
                        <div className="flex items-start gap-1.5">
                          <CalendarDays size={13} className="mt-0.5 text-gray-400" />
                          <div>
                            <p>{new Date(c.starts_at).toLocaleString('vi-VN')}</p>
                            <p>→ {new Date(c.ends_at).toLocaleString('vi-VN')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleToggle(c)} title={c.is_active ? 'Tắt' : 'Bật'} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100">
                            <Power size={15} />
                          </button>
                          <button onClick={() => openEdit(c)} title="Sửa" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => handleDelete(c)} title="Xoá" className="p-2 rounded-lg text-rose-500 hover:bg-rose-50">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto" onClick={closeModal}>
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-3xl my-8 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {editing ? 'Cập nhật chiến dịch' : 'Tạo chiến dịch mới'}
                </h2>
                <p className="text-xs text-gray-500">% giảm giá lấy từ trường này, không tính ngược từ giá hiện tại.</p>
              </div>
              <button type="button" onClick={closeModal} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {!editing && (
                <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                  <p className="text-xs text-gray-500 mb-2">Mẫu nhanh — bấm để điền sẵn các trường:</p>
                  <div className="flex flex-wrap gap-2">
                    {PRESETS.map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => applyPreset(p.key)}
                        className="text-xs px-3 py-1.5 rounded-full bg-white border border-gray-200 hover:border-primary hover:text-primary transition-colors"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Tên chiến dịch *</label>
                  <input
                    value={form.name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        name: e.target.value,
                        slug: form.slug || slugifyVi(e.target.value),
                      })
                    }
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Slug</label>
                  <input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: slugifyVi(e.target.value) })}
                    className="input-field font-mono text-sm"
                    placeholder="vd: sale-11-11"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Banner / Tagline</label>
                <input
                  value={form.banner_text}
                  onChange={(e) => setForm({ ...form, banner_text: e.target.value })}
                  className="input-field"
                  placeholder="VD: 11.11 · Single Day Mega Sale"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Mô tả</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-field resize-none"
                  rows={2}
                  placeholder="Mô tả ngắn hiển thị ở trang khuyến mãi (tuỳ chọn)."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">% giảm giá *</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={form.discount_percent}
                    onChange={(e) => setForm({ ...form, discount_percent: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Bắt đầu *</label>
                  <input
                    type="datetime-local"
                    value={form.starts_at}
                    onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Kết thúc *</label>
                  <input
                    type="datetime-local"
                    value={form.ends_at}
                    onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Phạm vi áp dụng</label>
                  <select
                    value={form.scope}
                    onChange={(e) =>
                      setForm({ ...form, scope: e.target.value as Scope, targets: [] })
                    }
                    className="input-field"
                  >
                    <option value="all">Toàn shop</option>
                    <option value="category">Theo danh mục</option>
                    <option value="product">Theo sản phẩm</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Độ ưu tiên</label>
                  <input
                    type="number"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="input-field"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Số càng lớn càng được ưu tiên khi nhiều campaign trùng.</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Trạng thái</label>
                  <label className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 bg-white">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                      className="accent-primary"
                    />
                    <span className="text-sm text-gray-700">{form.is_active ? 'Đang bật' : 'Đang tắt'}</span>
                  </label>
                </div>
              </div>

              {form.scope === 'category' && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Chọn danh mục áp dụng</label>
                  <div className="rounded-xl border border-gray-200 p-3 max-h-56 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-2">
                    {categories.length === 0 && (
                      <p className="text-xs text-gray-400">Chưa có danh mục nào.</p>
                    )}
                    {categories.map((c) => {
                      const checked = isTargetChecked('category', c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggleTarget('category', c.id)}
                          className={`text-left rounded-lg border px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                            checked ? 'border-primary bg-primary-50 text-primary' : 'border-gray-200 hover:border-primary'
                          }`}
                        >
                          <span className="truncate">{c.name}</span>
                          {checked && <Check size={12} />}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Đã chọn {form.targets.length} danh mục.</p>
                </div>
              )}

              {form.scope === 'product' && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Chọn sản phẩm áp dụng</label>
                  <input
                    type="text"
                    placeholder="Tìm theo tên / brand..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="input-field mb-2"
                  />
                  <div className="rounded-xl border border-gray-200 p-3 max-h-60 overflow-y-auto space-y-1.5">
                    {filteredProducts.length === 0 && (
                      <p className="text-xs text-gray-400">Không có sản phẩm.</p>
                    )}
                    {filteredProducts.map((p) => {
                      const checked = isTargetChecked('product', p.id);
                      return (
                        <label
                          key={p.id}
                          className={`flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                            checked ? 'bg-primary-50 text-primary' : 'hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleTarget('product', p.id)}
                            className="accent-primary"
                          />
                          <span className="text-sm flex-1 truncate">{p.name}</span>
                          {p.brand && <span className="text-[11px] text-gray-400">{p.brand}</span>}
                        </label>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Đã chọn {form.targets.length} sản phẩm.</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3 bg-gray-50">
              <button type="button" onClick={closeModal} className="btn-ghost">Huỷ</button>
              <button type="submit" disabled={saving} className="btn-primary inline-flex items-center gap-2">
                <Check size={15} />
                {saving ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Tạo mới'}
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
}
