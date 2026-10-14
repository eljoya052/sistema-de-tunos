import React, { useState, useEffect } from 'react';
import { repository } from '../../lib/repository';
import { Profile, Service } from '../../types/database';
import { Users, UserPlus, Shield, Check, X, Edit2, ShieldAlert } from 'lucide-react';

export const ProfessionalsManagementPage: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New professional modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState<'PROFESSIONAL' | 'ADMIN'>('PROFESSIONAL');
  const [newDesk, setNewDesk] = useState('Box 1');
  const [newSelectedServices, setNewSelectedServices] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit assignments modal state
  const [editProfile, setEditProfile] = useState<Profile | null>(null);
  const [editDesk, setEditDesk] = useState('');
  const [editSelectedServices, setEditSelectedServices] = useState<string[]>([]);

  const [assignmentsMap, setAssignmentsMap] = useState<Record<string, Service[]>>({});

  const loadData = async () => {
    try {
      const [profs, srvs] = await Promise.all([
        repository.getProfiles(),
        repository.getServices(),
      ]);
      setProfiles(profs);
      setServices(srvs);

      const map: Record<string, Service[]> = {};
      for (const p of profs) {
        map[p.id] = await repository.getProfessionalServices(p.id);
      }
      setAssignmentsMap(map);
    } catch (e) {
      console.error('Error loading professionals:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = repository.subscribeRealtime(() => {
      loadData();
    });
    return unsubscribe;
  }, []);

  const handleCreateProfessional = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!newEmail.trim() || !newFullName.trim()) {
      setFormError('Todos los campos son requeridos.');
      return;
    }
    if (newRole === 'PROFESSIONAL' && newSelectedServices.length === 0) {
      setFormError('Debe asignar al menos un servicio al profesional.');
      return;
    }

    try {
      await repository.addProfessional({
        email: newEmail,
        full_name: newFullName,
        role: newRole,
        desk_number: newDesk,
        service_ids: newSelectedServices,
      });

      setShowAddModal(false);
      setNewEmail('');
      setNewFullName('');
      setNewDesk('Box 1');
      setNewSelectedServices([]);
      await loadData();
    } catch (err: unknown) {
      setFormError((err as Error).message || 'Error al crear usuario');
    }
  };

  const openEditModal = async (profile: Profile) => {
    setEditProfile(profile);
    setEditDesk(profile.desk_number || '');
    const assigned = await repository.getProfessionalServices(profile.id);
    setEditSelectedServices(assigned.map((s) => s.id));
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProfile) return;
    try {
      await repository.updateProfessionalAssignments(
        editProfile.id,
        editSelectedServices,
        editDesk
      );
      setEditProfile(null);
      await loadData();
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  const handleToggleActive = async (profile: Profile) => {
    if (
      window.confirm(
        `¿Confirmas que deseas ${profile.active ? 'desactivar' : 'reactivar'} la cuenta de ${
          profile.full_name
        }?`
      )
    ) {
      await repository.toggleProfileActive(profile.id, !profile.active);
      await loadData();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Administración de Profesionales y Cuentas
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestión de credenciales individuales, asignación a uno o varios servicios y control de acceso.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>Nuevo Usuario / Profesional</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
            <tr>
              <th className="px-4 py-3">Profesión / Cargo</th>
              <th className="px-4 py-3">Correo / Acceso</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Puesto / Módulo</th>
              <th className="px-4 py-3">Servicios Asignados</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {profiles.map((p) => {
              const assigned = repository.getProfessionalServices(p.id);
              return (
                <tr key={p.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-4 py-3 font-bold text-slate-900 text-sm">
                    {p.full_name}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600">
                    {p.email}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold ${
                        p.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      <Shield className="w-3 h-3" />
                      {p.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {p.desk_number || 'Sin módulo asignado'}
                  </td>
                  <td className="px-4 py-3">
                    {p.role === 'ADMIN' ? (
                      <span className="text-slate-500 italic">Acceso global a todos los servicios</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {(assignmentsMap[p.id] || []).length > 0 ? (
                          (assignmentsMap[p.id] || []).map((srv) => (
                            <span
                              key={srv.id}
                              className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded border border-slate-200"
                            >
                              {srv.code}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic">Sin servicios</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        p.active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {p.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-md transition"
                        title="Modificar puesto y servicios asignados"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(p)}
                        className={`p-1.5 rounded-md transition text-xs font-semibold ${
                          p.active
                            ? 'text-rose-600 hover:bg-rose-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={p.active ? 'Desactivar cuenta' : 'Reactivar cuenta'}
                      >
                        {p.active ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Professional Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Registrar Puesto de Profesión
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="m-5 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateProfessional} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Profesión / Especialidad
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Fonoaudiología, Nutrición, etc."
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Correo Electrónico (Identificador de Acceso)
                </label>
                <input
                  type="email"
                  required
                  placeholder="profesional@operativo.cl"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">
                    Rol
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as 'ADMIN' | 'PROFESSIONAL')}
                    className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  >
                    <option value="PROFESSIONAL">PROFESIONAL</option>
                    <option value="ADMIN">ADMINISTRADOR</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">
                    Módulo / Box habitual
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Box 3"
                    value={newDesk}
                    onChange={(e) => setNewDesk(e.target.value)}
                    className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
              </div>

              {newRole === 'PROFESSIONAL' && (
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1.5">
                    Asignar a Servicios:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {services.map((s) => {
                      const isSelected = newSelectedServices.includes(s.id);
                      return (
                        <button
                          type="button"
                          key={s.id}
                          onClick={() => {
                            setNewSelectedServices((prev) =>
                              isSelected ? prev.filter((id) => id !== s.id) : [...prev, s.id]
                            );
                          }}
                          className={`p-2 rounded-lg border text-left flex items-center justify-between ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-600 text-indigo-900 font-bold'
                              : 'bg-white border-slate-200 text-slate-700'
                          }`}
                        >
                          <span>{s.code} · {s.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  Crear Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Assignments Modal */}
      {editProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Asignación de Servicios ({editProfile.full_name})
              </h3>
              <button
                onClick={() => setEditProfile(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Módulo / Box de Atención (Visible en Pantalla Pública)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Box 2, Sillón 1..."
                  value={editDesk}
                  onChange={(e) => setEditDesk(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1.5">
                  Servicios Autorizados:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {services.map((s) => {
                    const isSelected = editSelectedServices.includes(s.id);
                    return (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => {
                          setEditSelectedServices((prev) =>
                            isSelected ? prev.filter((id) => id !== s.id) : [...prev, s.id]
                          );
                        }}
                        className={`p-2 rounded-lg border text-left flex items-center justify-between ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-600 text-indigo-900 font-bold'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <span>{s.code} · {s.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditProfile(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  Guardar Asignaciones
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
