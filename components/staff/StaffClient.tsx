'use client';

import { useState, useTransition } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { NavIcon } from '@/components/ui/NavIcon';

type Role = 'ADMIN' | 'MANAGER' | 'STAFF' | 'KITCHEN';

interface StaffMember {
  id: string; name: string; email: string;
  role: Role; avatar: string | null; active: boolean; createdAt: string;
}

const ROLE_BADGE: Record<Role, 'violet' | 'amber' | 'blue' | 'emerald'> = {
  ADMIN: 'violet', MANAGER: 'amber', STAFF: 'blue', KITCHEN: 'emerald',
};

const ROLES: Role[] = ['ADMIN', 'MANAGER', 'STAFF', 'KITCHEN'];

const ROLE_DESC: Record<Role, string> = {
  ADMIN:   'Full access — settings, staff, all data',
  MANAGER: 'View staff, manage menu and orders',
  STAFF:   'Orders, tables, and guest menu',
  KITCHEN: 'Kitchen display only',
};

function Avatar({ name, avatar, size = 40 }: { name: string; avatar: string | null; size?: number }) {
  const initials = avatar ?? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, var(--brand-1), var(--brand-2))',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.32, fontWeight: 700, color: '#fff', flexShrink: 0,
      letterSpacing: '0.02em',
    }}>
      {initials}
    </div>
  );
}

interface Props {
  initialStaff: StaffMember[];
  currentUserId: string;
  isAdmin: boolean;
}

export function StaffClient({ initialStaff, currentUserId, isAdmin }: Props) {
  const [staff, setStaff] = useState(initialStaff);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  // Add modal
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', email: '', password: '', role: 'STAFF' as Role });
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  // Edit modal
  const [editTarget, setEditTarget] = useState<StaffMember | null>(null);
  const [editForm, setEditForm] = useState({ name: '', role: 'STAFF' as Role });
  const [editError, setEditError] = useState('');

  // Deactivate confirm
  const [deactivateTarget, setDeactivateTarget] = useState<StaffMember | null>(null);

  const filtered = staff.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || s.role === roleFilter;
    return matchSearch && matchRole;
  });

  async function handleAdd() {
    setAddError('');
    if (!addForm.name.trim() || !addForm.email.trim() || !addForm.password.trim()) {
      setAddError('All fields are required.'); return;
    }
    setAddLoading(true);
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (!res.ok) { setAddError(data.error ?? 'Something went wrong.'); return; }
      setStaff(prev => [...prev, data.user]);
      setAddOpen(false);
      setAddForm({ name: '', email: '', password: '', role: 'STAFF' });
    } finally {
      setAddLoading(false);
    }
  }

  function openEdit(member: StaffMember) {
    setEditTarget(member);
    setEditForm({ name: member.name, role: member.role });
    setEditError('');
  }

  async function handleEdit() {
    if (!editTarget) return;
    setEditError('');
    startTransition(async () => {
      const res = await fetch(`/api/staff/${editTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data.error ?? 'Something went wrong.'); return; }
      setStaff(prev => prev.map(s => s.id === editTarget.id ? data.user : s));
      setEditTarget(null);
    });
  }

  async function handleToggleActive(member: StaffMember) {
    setError('');
    startTransition(async () => {
      const res = await fetch(`/api/staff/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !member.active }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Something went wrong.'); return; }
      setStaff(prev => prev.map(s => s.id === member.id ? data.user : s));
      setDeactivateTarget(null);
    });
  }

  const active  = staff.filter(s => s.active).length;
  const counts  = ROLES.reduce((acc, r) => ({ ...acc, [r]: staff.filter(s => s.role === r).length }), {} as Record<Role, number>);

  return (
    <div className="p-8 pb-12 max-w-[1100px] mx-auto w-full">

      {/* Stats row */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total staff', value: staff.length },
          { label: 'Active', value: active },
          { label: 'Admins', value: counts.ADMIN },
          { label: 'Managers', value: counts.MANAGER },
          { label: 'Kitchen', value: counts.KITCHEN },
        ].map((s, i) => (
          <div key={i} className="rounded-[16px] p-4 border"
            style={{ background: '#fff', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <div className="text-[26px] font-semibold leading-none" style={{ fontFamily: 'var(--font-fraunces)' }}>{s.value}</div>
            <div className="text-[11.5px] mt-1.5 font-medium" style={{ color: 'var(--muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center gap-2 px-3 py-2 rounded-[10px] border flex-1 max-w-xs"
          style={{ background: 'var(--canvas-2)', borderColor: 'var(--border)' }}>
          <NavIcon name="search" size={14} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="border-0 bg-transparent outline-none flex-1 text-[13px]"
            style={{ color: 'var(--text)' }}
          />
        </div>

        <div className="flex gap-1.5">
          {(['all', ...ROLES] as const).map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
              style={{
                background: roleFilter === r ? 'var(--text)' : 'var(--canvas-2)',
                color: roleFilter === r ? '#fff' : 'var(--muted)',
                border: '1px solid',
                borderColor: roleFilter === r ? 'var(--text)' : 'var(--border)',
              }}
            >
              {r === 'all' ? 'All' : r.charAt(0) + r.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="ml-auto">
          {isAdmin && (
            <Button onClick={() => setAddOpen(true)}>
              <NavIcon name="plus" size={14} /> Add staff
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl text-[13px] bg-red-50 text-red-700 border border-red-100">{error}</div>
      )}

      {/* Table */}
      <div className="rounded-[18px] border overflow-hidden" style={{ background: '#fff', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--canvas)' }}>
              {['Member', 'Role', 'Status', 'Joined', isAdmin ? 'Actions' : ''].map((h, i) => (
                <th key={i} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em]"
                  style={{ color: 'var(--muted)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-14 text-[13px]" style={{ color: 'var(--muted)' }}>
                  No staff found
                </td>
              </tr>
            )}
            {filtered.map((member, i) => (
              <tr
                key={member.id}
                style={{
                  borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                  opacity: member.active ? 1 : 0.5,
                }}
              >
                {/* Member */}
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar name={member.name} avatar={member.avatar} size={38} />
                    <div>
                      <div className="text-[13.5px] font-semibold flex items-center gap-2">
                        {member.name}
                        {member.id === currentUserId && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold">You</span>
                        )}
                      </div>
                      <div className="text-[12px] mt-0.5" style={{ color: 'var(--muted)' }}>{member.email}</div>
                    </div>
                  </div>
                </td>

                {/* Role */}
                <td className="px-5 py-3.5">
                  <div>
                    <Badge variant={ROLE_BADGE[member.role]}>
                      {member.role.charAt(0) + member.role.slice(1).toLowerCase()}
                    </Badge>
                    <div className="text-[11px] mt-1" style={{ color: 'var(--muted)' }}>
                      {ROLE_DESC[member.role]}
                    </div>
                  </div>
                </td>

                {/* Status */}
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 rounded-full ${member.active ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${member.active ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                    {member.active ? 'Active' : 'Inactive'}
                  </span>
                </td>

                {/* Joined */}
                <td className="px-5 py-3.5 text-[13px]" style={{ color: 'var(--muted)' }}>
                  {new Date(member.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>

                {/* Actions */}
                {isAdmin && (
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(member)}
                        className="px-3 py-1.5 rounded-lg border text-[12px] font-semibold transition-colors hover:bg-stone-50 flex items-center gap-1.5"
                        style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                      >
                        <NavIcon name="edit" size={13} /> Edit
                      </button>
                      {member.id !== currentUserId && (
                        <button
                          onClick={() => member.active ? setDeactivateTarget(member) : handleToggleActive(member)}
                          disabled={isPending}
                          className={`px-3 py-1.5 rounded-lg border text-[12px] font-semibold transition-colors disabled:opacity-50 ${member.active ? 'hover:bg-red-50 hover:border-red-200 hover:text-red-600' : 'hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700'}`}
                          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                        >
                          {member.active ? 'Deactivate' : 'Reactivate'}
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Add Modal ── */}
      <Modal open={addOpen} onClose={() => { setAddOpen(false); setAddError(''); }} title="Add staff member" size="sm">
        <div className="flex flex-col gap-4">
          {addError && (
            <div className="px-3 py-2.5 rounded-xl text-[13px] bg-red-50 text-red-700 border border-red-100">{addError}</div>
          )}
          {[
            { label: 'Full name', key: 'name', type: 'text', placeholder: 'e.g. Maya Chen' },
            { label: 'Email', key: 'email', type: 'email', placeholder: 'maya@brewline.cafe' },
            { label: 'Temporary password', key: 'password', type: 'password', placeholder: 'Min. 6 characters' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>{f.label}</label>
              <input
                type={f.type}
                value={addForm[f.key as keyof typeof addForm]}
                onChange={e => setAddForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full px-3.5 py-2.5 rounded-xl border text-[13.5px] outline-none transition-colors"
                style={{ borderColor: 'var(--border)', background: 'var(--canvas)', color: 'var(--text)' }}
              />
            </div>
          ))}

          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>Role</label>
            <div className="flex flex-col gap-2">
              {ROLES.map(r => (
                <label key={r} className="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors"
                  style={{
                    borderColor: addForm.role === r ? 'var(--brand-1)' : 'var(--border)',
                    background: addForm.role === r ? 'var(--brand-tint)' : '#fff',
                  }}>
                  <input type="radio" name="add-role" value={r} checked={addForm.role === r}
                    onChange={() => setAddForm(prev => ({ ...prev, role: r }))}
                    className="mt-0.5 accent-amber-500" />
                  <div>
                    <div className="text-[13px] font-semibold">
                      {r.charAt(0) + r.slice(1).toLowerCase()}
                    </div>
                    <div className="text-[11.5px]" style={{ color: 'var(--muted)' }}>{ROLE_DESC[r]}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <Button block onClick={handleAdd} disabled={addLoading}>
            {addLoading ? 'Creating…' : 'Create account'}
          </Button>
        </div>
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit staff member" size="sm">
        {editTarget && (
          <div className="flex flex-col gap-4">
            {editError && (
              <div className="px-3 py-2.5 rounded-xl text-[13px] bg-red-50 text-red-700 border border-red-100">{editError}</div>
            )}

            <div>
              <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>Full name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border text-[13.5px] outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--canvas)', color: 'var(--text)' }}
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>Role</label>
              <div className="flex flex-col gap-2">
                {ROLES.map(r => (
                  <label key={r} className="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors"
                    style={{
                      borderColor: editForm.role === r ? 'var(--brand-1)' : 'var(--border)',
                      background: editForm.role === r ? 'var(--brand-tint)' : '#fff',
                    }}>
                    <input type="radio" name="edit-role" value={r} checked={editForm.role === r}
                      onChange={() => setEditForm(prev => ({ ...prev, role: r }))}
                      className="mt-0.5 accent-amber-500" />
                    <div>
                      <div className="text-[13px] font-semibold">{r.charAt(0) + r.slice(1).toLowerCase()}</div>
                      <div className="text-[11.5px]" style={{ color: 'var(--muted)' }}>{ROLE_DESC[r]}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="ghost" block onClick={() => setEditTarget(null)}>Cancel</Button>
              <Button block onClick={handleEdit} disabled={isPending}>
                {isPending ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Deactivate Confirm ── */}
      <ConfirmDialog
        open={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={() => deactivateTarget && handleToggleActive(deactivateTarget)}
        title="Deactivate account"
        message={`${deactivateTarget?.name} will no longer be able to sign in. You can reactivate them at any time.`}
        confirmLabel="Deactivate"
        danger
        loading={isPending}
      />
    </div>
  );
}
