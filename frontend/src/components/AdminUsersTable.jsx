import { useState } from 'react';
import { ShieldCheck, ShieldOff, Trash2, UserCog } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { updateUserRole, updateUserStatus, deleteAdminUser } from '../api/admin.api.js';

const AdminUsersTable = ({ users, onChange, currentUserId }) => {
  const [busyId, setBusyId] = useState(null);

  const withBusy = async (id, fn) => {
    setBusyId(id);
    try {
      await fn();
      onChange?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setBusyId(null);
    }
  };

  const toggleRole = (u) =>
    withBusy(u._id, async () => {
      await updateUserRole(u._id, u.role === 'admin' ? 'user' : 'admin');
      toast.success(`${u.name} is now ${u.role === 'admin' ? 'a user' : 'an admin'}`);
    });

  const toggleStatus = (u) =>
    withBusy(u._id, async () => {
      await updateUserStatus(u._id, !u.isActive);
      toast.success(`${u.name} ${u.isActive ? 'deactivated' : 'activated'}`);
    });

  const handleDelete = (u) => {
    if (!window.confirm(`Delete ${u.name} and all of their links? This cannot be undone.`)) return;
    withBusy(u._id, async () => {
      await deleteAdminUser(u._id);
      toast.success('User deleted');
    });
  };

  if (users.length === 0) {
    return <div className="card p-10 text-center text-ink-500">No users found</div>;
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50/60 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
              <th className="px-5 py-3">User</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Joined</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {users.map((u) => {
              const isSelf = u._id === currentUserId;
              const busy = busyId === u._id;
              return (
                <tr key={u._id} className="hover:bg-ink-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-ink-900">{u.name}{isSelf && <span className="text-ink-400 font-normal"> (you)</span>}</p>
                    <p className="text-xs text-ink-500">{u.email}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-brand-50 text-brand-700' : 'bg-ink-100 text-ink-600'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {u.isActive ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-ink-500">{format(new Date(u.createdAt), 'MMM d, yyyy')}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        title={u.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
                        disabled={busy || isSelf}
                        onClick={() => toggleRole(u)}
                        className="p-2 rounded-lg text-ink-500 hover:bg-ink-100 hover:text-brand-600 disabled:opacity-30"
                      >
                        <UserCog size={15} />
                      </button>
                      <button
                        title={u.isActive ? 'Deactivate' : 'Activate'}
                        disabled={busy || isSelf}
                        onClick={() => toggleStatus(u)}
                        className="p-2 rounded-lg text-ink-500 hover:bg-ink-100 hover:text-amber-600 disabled:opacity-30"
                      >
                        {u.isActive ? <ShieldOff size={15} /> : <ShieldCheck size={15} />}
                      </button>
                      <button
                        title="Delete user"
                        disabled={busy || isSelf}
                        onClick={() => handleDelete(u)}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-30"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsersTable;
