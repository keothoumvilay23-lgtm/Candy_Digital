'use client';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const EMPTY_FORM = { name: '', parent_id: '', is_active: '1' };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/categories/admin/list');
      setCategories(data.data);
    } catch { } finally { setLoading(false); }
  };

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setModal(true); };
  const openEdit = (c: any) => { setEditing(c); setForm({ name: c.name, parent_id: c.parent_id || '', is_active: String(c.is_active) }); setModal(true); };

  const handleSave = async () => {
    if (!form.name) { toast.error('Vui lòng nhập tên danh mục'); return; }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/categories/admin/${editing.id}`, form);
        toast.success('Cập nhật thành công');
      } else {
        await api.post('/categories/admin/create', form);
        toast.success('Tạo danh mục thành công');
      }
      setModal(false);
      fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Thất bại');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa danh mục này?')) return;
    try {
      await api.delete(`/categories/admin/${id}`);
      toast.success('Đã xóa');
      fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Xóa thất bại');
    }
  };

  const parents = categories.filter(c => !c.parent_id);

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Quản lý danh mục</h1>
          <p className="text-sm text-gray-500">{categories.length} danh mục</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 px-4 py-2.5">
          <Plus size={16} /> Thêm danh mục
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Tên danh mục', 'Slug', 'Danh mục cha', 'Số SP', 'Trạng thái', 'Thao tác'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              [...Array(4)].map((_, i) => <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>)
            ) : categories.map(cat => (
              <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-800">
                  {cat.parent_id && <span className="text-gray-400 mr-1">—</span>}
                  {cat.name}
                </td>
                <td className="px-4 py-3 text-xs text-gray-400 font-mono">{cat.slug}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{cat.parent_name || '—'}</td>
                <td className="px-4 py-3 text-gray-700">{cat.product_count}</td>
                <td className="px-4 py-3">
                  <span className={cat.is_active ? 'badge-status-done' : 'badge-status-cancelled'}>
                    {cat.is_active ? 'Hiển thị' : 'Ẩn'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(cat)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary-50 rounded-lg transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">{editing ? 'Sửa danh mục' : 'Thêm danh mục'}</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Tên danh mục *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Ví dụ: Điện thoại" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Danh mục cha</label>
                <select value={form.parent_id} onChange={e => setForm({ ...form, parent_id: e.target.value })} className="input-field">
                  <option value="">Không có (danh mục gốc)</option>
                  {parents.filter(p => p.id !== editing?.id).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Trạng thái</label>
                <select value={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.value })} className="input-field">
                  <option value="1">Hiển thị</option>
                  <option value="0">Ẩn</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setModal(false)} className="btn-ghost flex-1 py-2.5">Hủy</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 py-2.5">
                {saving ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Tạo mới'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
