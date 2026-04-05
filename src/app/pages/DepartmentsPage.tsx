import { useState, useMemo } from "react";
import { Plus, Edit2, Trash2, X, Building2, BookOpen } from "lucide-react";
import { useData } from "../contexts/DataContext";

export default function DepartmentsPage() {
  const {
    departments, programmes,
    addDepartment, updateDepartment, deleteDepartment,
    addProgramme, updateProgramme, deleteProgramme,
    courses, users,
  } = useData();

  const [modal, setModal]           = useState<"addDept" | "editDept" | "addProg" | "editProg" | null>(null);
  const [error, setError]           = useState("");
  const [deptName, setDeptName]     = useState("");
  const [progName, setProgName]     = useState("");
  const [progDeptIds, setProgDeptIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState("");

  const deptStats = useMemo(() => {
    const map: Record<string, { courses: number; students: number; programmes: number }> = {};
    departments.forEach(d => {
      map[d.id] = {
        courses:    courses.filter(c => c.departmentId === d.id).length,
        students:   users.filter(u => u.role === "student" && u.departmentId === d.id).length,
        programmes: programmes.filter(p => (p.departmentIds ?? [p.departmentIds]).includes(d.id)).length,
      };
    });
    return map;
  }, [departments, courses, users, programmes]);

  const openAddDept  = () => { setDeptName(""); setError(""); setModal("addDept"); };
  const openEditDept = (id: string, name: string) => { setSelectedId(id); setDeptName(name); setError(""); setModal("editDept"); };

  const handleSaveDept = async () => {
    if (!deptName.trim()) { setError("Department name is required."); return; }
    try {
      if (modal === "addDept") await addDepartment(deptName.trim());
      else await updateDepartment(selectedId, deptName.trim());
      setModal(null);
    } catch (e: any) { setError(e.message ?? "Failed to save department."); }
  };

  const handleDeleteDept = async (id: string, name: string) => {
    if (!window.confirm(`Delete department "${name}"? This will fail if it has courses or users.`)) return;
    try { await deleteDepartment(id); } catch (e: any) { alert(e.message ?? "Cannot delete department."); }
  };

  const openAddProg = (deptId?: string) => {
    setProgName(""); setProgDeptIds(deptId ? [deptId] : []); setError(""); setModal("addProg");
  };
  const openEditProg = (id: string, name: string, deptIds: string[]) => {
    setSelectedId(id); setProgName(name); setProgDeptIds(deptIds); setError(""); setModal("editProg");
  };

  const toggleDeptId = (id: string) => {
    setProgDeptIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSaveProg = async () => {
    if (!progName.trim())      { setError("Programme name is required."); return; }
    if (!progDeptIds.length)   { setError("Select at least one department."); return; }
    try {
      if (modal === "addProg") await addProgramme(progName.trim(), progDeptIds);
      else await updateProgramme(selectedId, progName.trim(), progDeptIds);
      setModal(null);
    } catch (e: any) { setError(e.message ?? "Failed to save programme."); }
  };

  const handleDeleteProg = async (id: string, name: string) => {
    if (!window.confirm(`Delete programme "${name}"?`)) return;
    try { await deleteProgramme(id); } catch (e: any) { alert(e.message ?? "Cannot delete programme."); }
  };

  const inputCls = "w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500";

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Departments & Programmes</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {departments.length} department{departments.length !== 1 ? "s" : ""} · {programmes.length} programme{programmes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={openAddDept}
            className="flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--theme-primary)' }}>
            <Plus size={16} /> Add Department
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {departments.map(dept => {
          const stats = deptStats[dept.id] ?? { courses: 0, students: 0, programmes: 0 };
          const deptProgrammes = programmes.filter(p =>
            (p.departmentIds ?? [(p as any).departmentId]).includes(dept.id)
          );
          return (
            <div key={dept.id} className="bg-white dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, transparent)' }}>
                    <Building2 size={18} style={{ color: 'var(--theme-primary)' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{dept.name}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">
                      {stats.courses} course{stats.courses !== 1 ? "s" : ""} · {stats.students} student{stats.students !== 1 ? "s" : ""} · {stats.programmes} programme{stats.programmes !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openAddProg(dept.id)}
                    className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded transition-colors hover:opacity-80"
                    style={{ color: 'var(--theme-primary)' }}>
                    <Plus size={12} /> Programme
                  </button>
                  <button onClick={() => openEditDept(dept.id, dept.name)}
                    className="p-1.5 rounded-lg text-gray-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDeleteDept(dept.id, dept.name)}
                    className="p-1.5 rounded-lg text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {deptProgrammes.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-slate-500 px-5 py-3 italic">No programmes yet.</p>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
                  {deptProgrammes.map(prog => {
                    const deptIds = prog.departmentIds ?? [(prog as any).departmentId];
                    return (
                      <div key={prog.id} className="flex items-center justify-between px-5 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <BookOpen size={14} style={{ color: 'var(--theme-primary)' }} className="opacity-60" />
                          <span className="text-sm text-gray-700 dark:text-slate-300">{prog.name}</span>
                          {deptIds.length > 1 && (
                            <span className="text-xs px-1.5 py-0.5 rounded border"
                              style={{
                                backgroundColor: 'color-mix(in srgb, var(--theme-primary) 8%, transparent)',
                                borderColor:     'color-mix(in srgb, var(--theme-primary) 20%, transparent)',
                                color:           'var(--theme-primary)',
                              }}>
                              {deptIds.length} depts
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEditProg(prog.id, prog.name, deptIds)}
                            className="p-1 rounded text-gray-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => handleDeleteProg(prog.id, prog.name)}
                            className="p-1 rounded text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Dept Modal */}
      {(modal === "addDept" || modal === "editDept") && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700">
              <h2 className="font-semibold text-gray-900 dark:text-white">{modal === "addDept" ? "Add Department" : "Edit Department"}</h2>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3">
              {error && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-2 rounded-lg">{error}</p>}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Department Name *</label>
                <input value={deptName} onChange={e => setDeptName(e.target.value)} placeholder="e.g. Computer Science" className={inputCls} />
              </div>
            </div>
            <div className="p-5 pt-0 flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 dark:border-slate-700 rounded-lg py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800">Cancel</button>
              <button onClick={handleSaveDept} className="flex-1 text-white rounded-lg py-2 text-sm font-medium hover:opacity-90"
                style={{ backgroundColor: 'var(--theme-primary)' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Programme Modal */}
      {(modal === "addProg" || modal === "editProg") && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700">
              <h2 className="font-semibold text-gray-900 dark:text-white">{modal === "addProg" ? "Add Programme" : "Edit Programme"}</h2>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3">
              {error && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-2 rounded-lg">{error}</p>}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Programme Name *</label>
                <input value={progName} onChange={e => setProgName(e.target.value)} placeholder="e.g. BSc Computer Science" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-2">Departments * <span className="text-gray-400 dark:text-slate-500 font-normal">(select one or more)</span></label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {departments.map(d => {
                    const checked = progDeptIds.includes(d.id);
                    return (
                      <button key={d.id} type="button" onClick={() => toggleDeptId(d.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg border-2 text-sm transition-all flex items-center gap-2 ${
                          checked
                            ? 'border-[var(--theme-primary)] text-gray-900 dark:text-white'
                            : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-500'
                        }`}
                        style={checked ? { backgroundColor: 'color-mix(in srgb, var(--theme-primary) 8%, transparent)' } : {}}>
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${checked ? 'border-[var(--theme-primary)]' : 'border-gray-300 dark:border-slate-600'}`}
                          style={checked ? { backgroundColor: 'var(--theme-primary)', borderColor: 'var(--theme-primary)' } : {}}>
                          {checked && <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                        {d.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="p-5 pt-0 flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 dark:border-slate-700 rounded-lg py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800">Cancel</button>
              <button onClick={handleSaveProg} className="flex-1 text-white rounded-lg py-2 text-sm font-medium hover:opacity-90"
                style={{ backgroundColor: 'var(--theme-primary)' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}