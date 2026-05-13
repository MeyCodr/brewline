'use client';

import { useState, useTransition } from 'react';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import { NavIcon } from '@/components/ui/NavIcon';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { formatCurrency } from '@/lib/utils';

interface MenuItem {
  id: string; name: string; description: string; price: number;
  categoryId: string; categoryName: string; imageUrl: string | null;
  featured: boolean; available: boolean;
}
interface Category { id: string; name: string; icon: string; }
interface Props { initialData: { items: MenuItem[]; categories: Category[] }; }

const EMPTY_FORM = { name: '', description: '', price: '', categoryId: '', imageUrl: '', featured: false, available: true };

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="block text-[12px] font-semibold mb-1.5" style={{ color: '#57534e' }}>{children}</span>;
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-3 py-2 border rounded-[10px] text-[13.5px] outline-none transition-colors mb-3"
      style={{ borderColor: 'var(--border)', color: 'var(--text)', background: '#fff' }}
      onFocus={e => { e.target.style.borderColor = 'var(--brand-1)'; e.target.style.boxShadow = '0 0 0 3px var(--brand-tint)'; }}
      onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
    />
  );
}

function Textarea({ ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      rows={3}
      className="w-full px-3 py-2 border rounded-[10px] text-[13.5px] outline-none transition-colors mb-3 resize-none"
      style={{ borderColor: 'var(--border)', color: 'var(--text)', background: '#fff' }}
      onFocus={e => { e.target.style.borderColor = 'var(--brand-1)'; e.target.style.boxShadow = '0 0 0 3px var(--brand-tint)'; }}
      onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
    />
  );
}

interface ItemFormProps {
  form: typeof EMPTY_FORM;
  categories: Category[];
  onChange: (field: string, value: string | boolean) => void;
  onSubmit: () => void;
  onClose: () => void;
  loading: boolean;
  isEdit: boolean;
}

function ItemForm({ form, categories, onChange, onSubmit, onClose, loading, isEdit }: ItemFormProps) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-x-3">
        <div className="col-span-2">
          <FieldLabel>Item name *</FieldLabel>
          <Input
            value={form.name}
            onChange={e => onChange('name', e.target.value)}
            placeholder="e.g. Flat White"
          />
        </div>
        <div>
          <FieldLabel>Price (RM) *</FieldLabel>
          <Input
            type="number"
            min="0"
            step="0.10"
            value={form.price}
            onChange={e => onChange('price', e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div>
          <FieldLabel>Category *</FieldLabel>
          <select
            value={form.categoryId}
            onChange={e => onChange('categoryId', e.target.value)}
            className="w-full px-3 py-2 border rounded-[10px] text-[13.5px] outline-none mb-3 appearance-none"
            style={{ borderColor: 'var(--border)', color: 'var(--text)', background: '#fff' }}
          >
            <option value="">Select…</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <FieldLabel>Description</FieldLabel>
          <Textarea
            value={form.description}
            onChange={e => onChange('description', e.target.value)}
            placeholder="Short description…"
          />
        </div>
        <div className="col-span-2">
          <FieldLabel>Image</FieldLabel>
          <ImageUploader
            value={form.imageUrl}
            onChange={url => onChange('imageUrl', url)}
          />
        </div>
      </div>

      <div className="flex items-center gap-6 mb-5">
        <label className="flex items-center gap-2 cursor-pointer text-[13px]" style={{ color: 'var(--text)' }}>
          <input
            type="checkbox"
            checked={form.featured}
            onChange={e => onChange('featured', e.target.checked)}
            style={{ accentColor: 'var(--brand-1)', width: 15, height: 15 }}
          />
          Featured item
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-[13px]" style={{ color: 'var(--text)' }}>
          <input
            type="checkbox"
            checked={form.available}
            onChange={e => onChange('available', e.target.checked)}
            style={{ accentColor: 'var(--brand-1)', width: 15, height: 15 }}
          />
          Available now
        </label>
      </div>

      <div className="flex gap-2 justify-end border-t pt-4" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-[10px] border text-[13px] font-semibold"
          style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          disabled={loading}
        >
          Cancel
        </button>
        <Button variant="primary" onClick={onSubmit} disabled={loading || !form.name || !form.price || !form.categoryId}>
          {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Add item'}
        </Button>
      </div>
    </div>
  );
}

export function MenuClient({ initialData }: Props) {
  const [items, setItems] = useState(initialData.items);
  const [categories, setCategories] = useState(initialData.categories);
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [, startTransition] = useTransition();

  // Modals
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // New category modal
  const [catOpen, setCatOpen] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', icon: '' });
  const [catSaving, setCatSaving] = useState(false);
  const [catError, setCatError] = useState('');

  const filtered = items.filter(it => {
    const inTab = tab === 'all' || it.categoryId === tab;
    const inSearch = !query || it.name.toLowerCase().includes(query.toLowerCase());
    return inTab && inSearch;
  });

  function openAdd() {
    setForm({ ...EMPTY_FORM, categoryId: categories[0]?.id ?? '' });
    setAddOpen(true);
  }

  async function handleAddCategory() {
    if (!catForm.name || !catForm.icon) { setCatError('Name and icon are required.'); return; }
    setCatSaving(true);
    setCatError('');
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(catForm),
    });
    setCatSaving(false);
    if (res.ok) {
      const { category } = await res.json();
      setCategories(prev => [...prev, { id: category.id, name: category.name, icon: category.icon }]);
      setCatOpen(false);
      setCatForm({ name: '', icon: '' });
    } else {
      const data = await res.json();
      setCatError(data.error ?? 'Failed to create category.');
    }
  }

  function openEdit(item: MenuItem) {
    setForm({
      name: item.name,
      description: item.description,
      price: String(item.price),
      categoryId: item.categoryId,
      imageUrl: item.imageUrl ?? '',
      featured: item.featured,
      available: item.available,
    });
    setEditItem(item);
  }

  function changeForm(field: string, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleAdd() {
    if (!form.name || !form.price || !form.categoryId) return;
    setSaving(true);
    const res = await fetch('/api/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        categoryId: form.categoryId,
        imageUrl: form.imageUrl || null,
        featured: form.featured,
        available: form.available,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const { item } = await res.json();
      const cat = categories.find(c => c.id === item.categoryId);
      setItems(prev => [...prev, { ...item, price: Number(item.price), categoryName: cat?.name ?? '' }]);
      setAddOpen(false);
    }
  }

  async function handleEdit() {
    if (!editItem || !form.name || !form.price || !form.categoryId) return;
    setSaving(true);
    const res = await fetch(`/api/menu/${editItem.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        categoryId: form.categoryId,
        imageUrl: form.imageUrl || null,
        featured: form.featured,
        available: form.available,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const { item } = await res.json();
      const cat = categories.find(c => c.id === item.categoryId);
      setItems(prev => prev.map(i => i.id === item.id ? { ...item, price: Number(item.price), categoryName: cat?.name ?? '' } : i));
      setEditItem(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch(`/api/menu/${deleteTarget.id}`, { method: 'DELETE' });
    setDeleting(false);
    if (res.ok) {
      setItems(prev => prev.filter(i => i.id !== deleteTarget.id));
      setDeleteTarget(null);
    }
  }

  function toggleAvail(id: string) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const next = !item.available;
    setItems(prev => prev.map(i => i.id === id ? { ...i, available: next } : i));
    startTransition(async () => {
      const res = await fetch(`/api/menu/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: next }),
      });
      if (!res.ok) setItems(prev => prev.map(i => i.id === id ? { ...i, available: !next } : i));
    });
  }

  return (
    <div className="p-8 pb-12 max-w-[1400px] mx-auto w-full">
      {/* Page head */}
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h2 className="text-[28px] font-semibold tracking-tight m-0" style={{ fontFamily: 'var(--font-fraunces)' }}>Menu</h2>
          <p className="text-[13.5px] mt-1 m-0" style={{ color: 'var(--muted)' }}>
            {items.length} items · {categories.length} categories
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="md" onClick={() => { setCatForm({ name: '', icon: '' }); setCatError(''); setCatOpen(true); }}><NavIcon name="filter" size={14} />New category</Button>
          <Button variant="primary" size="md" onClick={openAdd}><NavIcon name="plus" size={14} />Add item</Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 mb-5 flex-wrap">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-[10px] border w-80"
          style={{ background: 'var(--canvas-2)', borderColor: 'var(--border)', color: 'var(--muted)' }}
        >
          <NavIcon name="search" size={15} />
          <input
            placeholder="Search the menu…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="border-0 bg-transparent outline-none flex-1 text-[13px]"
            style={{ color: 'var(--text)' }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[{ id: 'all', label: 'All', icon: '' }, ...categories.map(c => ({ id: c.id, label: c.name, icon: c.icon }))].map(c => (
            <button
              key={c.id}
              onClick={() => setTab(c.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[13px] font-medium transition-all duration-150"
              style={{ background: tab === c.id ? 'var(--text)' : '#fff', color: tab === c.id ? 'var(--canvas)' : '#57534e', borderColor: tab === c.id ? 'var(--text)' : 'var(--border)' }}
            >
              {c.icon && <span className="text-[14px]">{c.icon}</span>}
              {c.label}
              <span className="opacity-60 font-semibold text-[11px]">
                {c.id === 'all' ? items.length : items.filter(i => i.categoryId === c.id).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {filtered.map(it => (
          <article
            key={it.id}
            className="rounded-[18px] border overflow-hidden flex flex-col transition-transform duration-150 hover:-translate-y-[3px]"
            style={{
              background: '#fff',
              borderColor: 'var(--border)',
              boxShadow: 'var(--shadow-sm)',
              opacity: it.available ? 1 : 0.6,
            }}
          >
            {/* Image */}
            <div className="relative overflow-hidden bg-stone-100" style={{ aspectRatio: '16/10' }}>
              {it.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={it.imageUrl}
                  alt={it.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0" style={{ background: 'var(--canvas-2)' }} />
              )}
              {it.featured && (
                <span className="absolute top-2.5 left-2.5 bg-white/95 text-[10.5px] font-bold px-2 py-1 rounded-full inline-flex items-center gap-1 uppercase tracking-wide z-10" style={{ color: 'var(--brand-text)' }}>
                  <NavIcon name="star" size={10} /> Featured
                </span>
              )}
              {!it.available && (
                <span className="absolute top-2.5 right-2.5 bg-stone-900/85 text-white text-[10.5px] font-bold px-2 py-1 rounded-full z-10">
                  86&apos;d
                </span>
              )}
            </div>

            {/* Body */}
            <div className="p-3.5 flex flex-col gap-2 flex-1">
              <div className="flex items-start justify-between gap-3">
                <h4 className="text-[17px] font-medium tracking-tight m-0" style={{ fontFamily: 'var(--font-fraunces)' }}>{it.name}</h4>
                <span className="text-[16px] font-medium flex-shrink-0" style={{ fontFamily: 'var(--font-fraunces)', color: 'var(--brand-text)' }}>
                  {formatCurrency(it.price)}
                </span>
              </div>
              <p className="text-[12.5px] leading-relaxed m-0 flex-1" style={{ color: 'var(--muted)' }}>{it.description}</p>
              <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <span className="text-[11px] font-medium" style={{ color: 'var(--muted)' }}>{it.categoryName}</span>
                <div className="flex items-center gap-1.5">
                  <Toggle checked={it.available} onChange={() => toggleAvail(it.id)} />
                  <button
                    onClick={() => openEdit(it)}
                    className="w-[26px] h-[26px] rounded-[7px] inline-flex items-center justify-center transition-colors duration-150 hover:bg-stone-100 hover:text-stone-700"
                    style={{ color: '#a8a29e' }}
                    title="Edit item"
                  >
                    <NavIcon name="edit" size={13} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(it)}
                    className="w-[26px] h-[26px] rounded-[7px] inline-flex items-center justify-center transition-colors duration-150 hover:bg-red-50 hover:text-red-500"
                    style={{ color: '#a8a29e' }}
                    title="Delete item"
                  >
                    <NavIcon name="trash" size={13} />
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-[14px]" style={{ color: 'var(--muted)' }}>
            {query ? `No results for "${query}"` : 'No items in this category'}
          </div>
        )}
      </div>

      {/* Add item modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add menu item">
        <ItemForm
          form={form}
          categories={categories}
          onChange={changeForm}
          onSubmit={handleAdd}
          onClose={() => setAddOpen(false)}
          loading={saving}
          isEdit={false}
        />
      </Modal>

      {/* Edit item modal */}
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit item">
        <ItemForm
          form={form}
          categories={categories}
          onChange={changeForm}
          onSubmit={handleEdit}
          onClose={() => setEditItem(null)}
          loading={saving}
          isEdit
        />
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete item"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
      />

      {/* New category modal */}
      <Modal open={catOpen} onClose={() => setCatOpen(false)} title="New category" size="sm">
        <div>
          <label className="block mb-3">
            <span className="block text-[12px] font-semibold mb-1.5" style={{ color: '#57534e' }}>
              Emoji icon *
            </span>
            <input
              value={catForm.icon}
              onChange={e => setCatForm(p => ({ ...p, icon: e.target.value }))}
              placeholder="e.g. 🥤"
              maxLength={4}
              className="w-full px-3 py-2 border rounded-[10px] text-[20px] outline-none"
              style={{ borderColor: 'var(--border)', color: 'var(--text)', background: '#fff' }}
              onFocus={e => { e.target.style.borderColor = 'var(--brand-1)'; e.target.style.boxShadow = '0 0 0 3px var(--brand-tint)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
            />
          </label>
          <label className="block mb-4">
            <span className="block text-[12px] font-semibold mb-1.5" style={{ color: '#57534e' }}>
              Category name *
            </span>
            <input
              value={catForm.name}
              onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Cold Drinks"
              className="w-full px-3 py-2 border rounded-[10px] text-[13.5px] outline-none"
              style={{ borderColor: 'var(--border)', color: 'var(--text)', background: '#fff' }}
              onFocus={e => { e.target.style.borderColor = 'var(--brand-1)'; e.target.style.boxShadow = '0 0 0 3px var(--brand-tint)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
            />
          </label>
          {catError && (
            <div className="mb-3 text-[13px] text-red-600 bg-red-50 px-3 py-2 rounded-[10px]">{catError}</div>
          )}
          <div className="flex gap-2 justify-end border-t pt-4" style={{ borderColor: 'var(--border)' }}>
            <button
              onClick={() => setCatOpen(false)}
              className="px-4 py-2 rounded-[10px] border text-[13px] font-semibold"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              disabled={catSaving}
            >
              Cancel
            </button>
            <Button variant="primary" onClick={handleAddCategory} disabled={catSaving || !catForm.name || !catForm.icon}>
              {catSaving ? 'Creating…' : 'Create category'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
