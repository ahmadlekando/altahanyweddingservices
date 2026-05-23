import React, { useEffect, useState } from 'react';
import { Plus, Search, Shield, Pencil, Trash2, X, Save, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';
import { supabase, Profile, UserRole } from '../../lib/supabase';

const inputCls = 'w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-amber-500/50 font-arabic';

const roleColors: Record<UserRole, string> = {
  super_admin: 'bg-red-500/10 text-red-400',
  admin: 'bg-amber-500/10 text-amber-400',
  manager: 'bg-blue-500/10 text-blue-400',
  accountant: 'bg-green-500/10 text-green-400',
  employee: 'bg-gray-500/10 text-gray-400',
  customer: 'bg-cyan-500/10 text-cyan-400',
};
const roleLabels: Record<UserRole, { ar: string; en: string }> = {
  super_admin: { ar: 'مدير عام', en: 'Super Admin' },
  admin: { ar: 'مدير', en: 'Admin' },
  manager: { ar: 'مشرف', en: 'Manager' },
  accountant: { ar: 'محاسب', en: 'Accountant' },
  employee: { ar: 'موظف', en: 'Employee' },
  customer: { ar: 'عميل', en: 'Customer' },
};

type UserForm = { full_name: string; email: string; password: string; role: UserRole; phone: string };

function emptyForm(): UserForm {
  return { full_name: '', email: '', password: '', role: 'employee', phone: '' };
}

export default function UsersPage() {
  const { t } = useLang();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data as Profile[]);
    setLoading(false);
  }

  function openNew() {
    setEditing(null);
    setForm(emptyForm());
    setError('');
    setShowForm(true);
  }

  function openEdit(u: Profile) {
    setEditing(u);
    setForm({ full_name: u.full_name || '', email: u.email || '', password: '', role: u.role, phone: u.phone || '' });
    setError('');
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.full_name.trim() || !form.email.trim()) return;
    setSaving(true);
    setError('');
    try {
      if (editing) {
        const updates: Record<string, unknown> = { full_name: form.full_name, role: form.role, phone: form.phone || null };
        const { error: updateErr } = await supabase.from('profiles').update(updates).eq('id', editing.id);
        if (updateErr) throw updateErr;
      } else {
        if (!form.password || form.password.length < 6) {
          setError(t('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'Password must be at least 6 characters'));
          setSaving(false);
          return;
        }
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { full_name: form.full_name } },
        });
        if (signUpErr) throw signUpErr;
        if (signUpData.user) {
          await supabase.from('profiles').update({ role: form.role, phone: form.phone || null, full_name: form.full_name }).eq('id', signUpData.user.id);
        }
      }
      setShowForm(false);
      fetchUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(u: Profile) {
    setToggling(u.id);
    await supabase.from('profiles').update({ is_active: !u.is_active }).eq('id', u.id);
    setToggling(null);
    fetchUsers();
  }

  async function handleChangeRole(u: Profile, role: UserRole) {
    await supabase.from('profiles').update({ role }).eq('id', u.id);
    fetchUsers();
  }

  async function handleDelete(id: string) {
    if (!confirm(t('هل أنت متأكد من الحذف؟', 'Are you sure?'))) return;
    setDeleting(id);
    await supabase.from('profiles').delete().eq('id', id);
    setDeleting(null);
    fetchUsers();
  }

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white font-arabic">{t('المستخدمون', 'Users')}</h1>
          <p className="text-gray-500 text-xs font-arabic mt-0.5">{t(`${users.length} مستخدم`, `${users.length} users`)}</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold font-arabic hover:bg-amber-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('مستخدم جديد', 'New User')}
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder={t('بحث...', 'Search...')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pr-10 pl-4 py-2.5 bg-gray-900 border border-white/10 rounded-xl text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-amber-500/50 font-arabic"
        />
      </div>

      <div className="bg-gray-900 rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-3 text-right text-xs text-gray-500 font-arabic">{t('المستخدم', 'User')}</th>
                <th className="px-4 py-3 text-right text-xs text-gray-500 font-arabic">{t('البريد الإلكتروني', 'Email')}</th>
                <th className="px-4 py-3 text-right text-xs text-gray-500 font-arabic">{t('الدور', 'Role')}</th>
                <th className="px-4 py-3 text-right text-xs text-gray-500 font-arabic">{t('الحالة', 'Status')}</th>
                <th className="px-4 py-3 text-right text-xs text-gray-500 font-arabic">{t('تاريخ الإنضمام', 'Joined')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 bg-white/5 rounded animate-pulse" /></td>
                ))}</tr>
              )) : filtered.length > 0 ? filtered.map(u => (
                <tr key={u.id} className="hover:bg-white/2 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {u.full_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <span className="text-sm text-gray-200 font-arabic">{u.full_name || '-'}</span>
                        {u.phone && <div className="text-xs text-gray-500">{u.phone}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">{u.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={e => handleChangeRole(u, e.target.value as UserRole)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-arabic border-0 outline-none cursor-pointer ${roleColors[u.role] || 'bg-gray-500/10 text-gray-400'}`}
                    >
                      {(Object.keys(roleLabels) as UserRole[]).map(r => (
                        <option key={r} value={r} className="bg-gray-900 text-gray-200">{t(roleLabels[r].ar, roleLabels[r].en)}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggleActive(u)} disabled={toggling === u.id} className="flex items-center gap-1.5 text-xs font-arabic">
                      {toggling === u.id
                        ? <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                        : u.is_active
                          ? <><ToggleRight className="w-5 h-5 text-green-400" /><span className="text-green-400">{t('نشط', 'Active')}</span></>
                          : <><ToggleLeft className="w-5 h-5 text-gray-500" /><span className="text-gray-500">{t('معطّل', 'Inactive')}</span></>
                      }
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('ar-AE') : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-amber-400 transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(u.id)} disabled={deleting === u.id} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-red-400 transition-colors">
                        {deleting === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="py-16 text-center text-gray-600 font-arabic">{t('لا يوجد مستخدمون', 'No users found')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-gray-900 rounded-2xl border border-white/10 w-full max-w-md my-8">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h2 className="font-semibold text-white font-arabic">{editing ? t('تعديل المستخدم', 'Edit User') : t('مستخدم جديد', 'New User')}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 font-arabic">{error}</div>
              )}
              <div>
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('الاسم الكامل *', 'Full Name *')}</label>
                <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('البريد الإلكتروني *', 'Email *')}</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} disabled={!!editing} className={`${inputCls} disabled:opacity-50`} />
              </div>
              {!editing && (
                <div>
                  <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('كلمة المرور *', 'Password *')}</label>
                  <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className={inputCls} />
                </div>
              )}
              <div>
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('رقم الهاتف', 'Phone')}</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-arabic mb-1.5 block">{t('الدور', 'Role')}</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))} className={inputCls}>
                  {(Object.keys(roleLabels) as UserRole[]).map(r => (
                    <option key={r} value={r}>{t(roleLabels[r].ar, roleLabels[r].en)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-5 pt-0 flex gap-2">
              <button onClick={handleSave} disabled={saving || !form.full_name.trim() || !form.email.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold font-arabic hover:bg-amber-600 transition-colors disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? t('جاري الحفظ...', 'Saving...') : t('حفظ', 'Save')}
              </button>
              <button onClick={() => setShowForm(false)} className="px-6 py-2.5 rounded-xl bg-white/5 text-gray-400 text-sm font-arabic hover:bg-white/10 transition-colors">{t('إلغاء', 'Cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
