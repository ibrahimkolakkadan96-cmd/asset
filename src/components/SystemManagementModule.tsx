import React, { useState, useMemo } from 'react';
import { useTracker } from '../context/TrackerContext';
import { ITSystem, ALL_LOCATIONS, formatBranchLabel } from '../types';
import {
  Search,
  Plus,
  Filter,
  Monitor,
  Edit2,
  Trash2,
  Eye,
  Building2,
  Cpu,
  HardDrive,
  User,
  X,
  Save,
  CheckCircle2,
} from 'lucide-react';

export const SystemManagementModule: React.FC = () => {
  const {
    systems,
    selectedBranch,
    setSelectedBranch,
    addSystem,
    updateSystem,
    deleteSystem,
  } = useTracker();

  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState<number | 'ALL'>(selectedBranch ?? 'ALL');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSystem, setEditingSystem] = useState<ITSystem | null>(null);
  const [viewingSystem, setViewingSystem] = useState<ITSystem | null>(null);

  // Form inputs
  const [formBranch, setFormBranch] = useState<number>(selectedBranch || 1);
  const [formName, setFormName] = useState('');
  const [formProcessor, setFormProcessor] = useState('Intel Core i5-12400 (6 Cores, 4.40 GHz)');
  const [formRam, setFormRam] = useState('16GB DDR4');
  const [formSsd, setFormSsd] = useState('512GB NVMe SSD');
  const [formWin, setFormWin] = useState('Windows 11 Pro 64-bit');
  const [formStaff, setFormStaff] = useState('');
  const [formRemarks, setFormRemarks] = useState('');
  const [formStatus, setFormStatus] = useState<'Active' | 'Under Repair' | 'Spare / Standby' | 'Returned'>('Active');
  const [isSaving, setIsSaving] = useState(false);

  // Filtered Systems
  const filteredSystems = useMemo(() => {
    return systems.filter((s) => {
      if (branchFilter !== 'ALL' && s.branchNumber !== branchFilter) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const match =
          s.systemName.toLowerCase().includes(q) ||
          s.processor.toLowerCase().includes(q) ||
          s.ram.toLowerCase().includes(q) ||
          s.ssd.toLowerCase().includes(q) ||
          s.assignedStaffName.toLowerCase().includes(q) ||
          s.remarks.toLowerCase().includes(q) ||
          `branch ${s.branchNumber}`.includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [systems, branchFilter, searchQuery]);

  const handleOpenAdd = () => {
    setEditingSystem(null);
    setFormBranch(selectedBranch || 1);
    setFormName(`BR${(selectedBranch || 1) < 10 ? '0' + (selectedBranch || 1) : selectedBranch || 1}-PC-0${systems.filter((s) => s.branchNumber === (selectedBranch || 1)).length + 1}`);
    setFormProcessor('Intel Core i5-12400 (6 Cores, 4.40 GHz)');
    setFormRam('16GB DDR4');
    setFormSsd('512GB NVMe SSD');
    setFormWin('Windows 11 Pro 64-bit');
    setFormStaff('');
    setFormRemarks('');
    setFormStatus('Active');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sys: ITSystem) => {
    setEditingSystem(sys);
    setFormBranch(sys.branchNumber);
    setFormName(sys.systemName);
    setFormProcessor(sys.processor);
    setFormRam(sys.ram);
    setFormSsd(sys.ssd);
    setFormWin(sys.windowsVersion);
    setFormStaff(sys.assignedStaffName);
    setFormRemarks(sys.remarks);
    setFormStatus(sys.status || 'Active');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('System / PC Name is required.');
      return;
    }
    if (!formStaff.trim()) {
      alert('Assigned Staff Name is required.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingSystem) {
        await updateSystem(editingSystem.id, {
          branchNumber: formBranch,
          systemName: formName.trim(),
          processor: formProcessor.trim(),
          ram: formRam.trim(),
          ssd: formSsd.trim(),
          windowsVersion: formWin.trim(),
          assignedStaffName: formStaff.trim(),
          remarks: formRemarks.trim(),
          status: formStatus,
        });
      } else {
        await addSystem({
          branchNumber: formBranch,
          systemName: formName.trim(),
          processor: formProcessor.trim(),
          ram: formRam.trim(),
          ssd: formSsd.trim(),
          windowsVersion: formWin.trim(),
          assignedStaffName: formStaff.trim(),
          remarks: formRemarks.trim(),
          status: formStatus,
        });
      }
      setIsModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete IT System "${name}"? This operation will be permanently recorded in the audit log.`)) {
      await deleteSystem(id);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8F5EE] text-[#303B38] overflow-hidden">
      {/* Top Controls Bar */}
      <div className="p-4 bg-[#FFFDF7] border-b border-[#E9E5DA] flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Module Heading */}
          <div className="flex items-center gap-2 mr-2">
            <div className="p-2 rounded-xl bg-[#A8DCCB] text-[#303B38] shadow-xs">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#303B38]">IT System Management</h2>
              <p className="text-[11px] text-[#7F8983]">
                Branch 1-22 Desktop Specifications & Staff Assignments (No IN/OUT movements)
              </p>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7F8983]" />
            <input
              type="text"
              placeholder="Search PC name, staff, CPU, RAM..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FFFDF7] border border-[#E9E5DA] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#303B38] placeholder-[#7F8983] focus:outline-none focus:border-[#A8DCCB] shadow-2xs"
            />
          </div>

          {/* Branch Filter */}
          <div className="flex items-center gap-1.5 bg-[#F8F5EE] border border-[#E9E5DA] rounded-xl px-3 py-1.5 text-xs text-[#303B38] shadow-2xs">
            <Building2 className="w-3.5 h-3.5 text-[#303B38]" />
            <span className="text-[#7F8983] font-medium">Branch:</span>
            <select
              value={branchFilter}
              onChange={(e) => {
                const val = e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value, 10);
                setBranchFilter(val);
                if (val !== 'ALL') setSelectedBranch(val);
              }}
              className="bg-transparent font-bold text-[#303B38] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Locations (Central + 22)</option>
              {ALL_LOCATIONS.map((b) => (
                <option key={b} value={b}>
                  {formatBranchLabel(b)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Add System Action */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#7F8983] font-mono mr-1">
            Total Systems: <strong className="text-[#303B38]">{filteredSystems.length}</strong>
          </span>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#A8DCCB] to-[#BFDCCB] hover:opacity-95 text-[#303B38] font-bold text-xs shadow-xs transition cursor-pointer border border-[#91c9b6]"
          >
            <Plus className="w-4 h-4 text-[#303B38]" />
            <span>Add System</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-[#FFFDF7] border border-[#E9E5DA] rounded-2xl shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F8F5EE] text-[#7F8983] font-bold uppercase text-[11px] border-b border-[#E9E5DA]">
                <th className="py-3 px-4">Branch</th>
                <th className="py-3 px-4">System / PC Name</th>
                <th className="py-3 px-4">Processor</th>
                <th className="py-3 px-4">RAM</th>
                <th className="py-3 px-4">SSD</th>
                <th className="py-3 px-4">Windows Version</th>
                <th className="py-3 px-4">Assigned Staff Name</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Remarks</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9E5DA]">
              {filteredSystems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#7F8983] text-xs">
                    No IT systems found matching your search and branch filter.
                  </td>
                </tr>
              ) : (
                filteredSystems.map((s) => (
                  <tr key={s.id} className="hover:bg-[#F8F5EE]/60 transition">
                    <td className="py-2.5 px-4 font-bold text-[#303B38]">
                      <span className="px-2 py-0.5 rounded-md bg-[#D8EEE4] text-[#303B38] border border-[#A8DCCB] text-[11px]">
                        {formatBranchLabel(s.branchNumber)}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-bold text-[#303B38] font-mono">
                      {s.systemName}
                    </td>
                    <td className="py-2.5 px-4 text-[#303B38] font-medium">
                      {s.processor}
                    </td>
                    <td className="py-2.5 px-4 text-[#303B38] font-mono font-semibold">
                      {s.ram}
                    </td>
                    <td className="py-2.5 px-4 text-[#303B38] font-mono">
                      {s.ssd}
                    </td>
                    <td className="py-2.5 px-4 text-[#7F8983]">
                      {s.windowsVersion}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-[#303B38] flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#A8DCCB] shrink-0" />
                      <span>{s.assignedStaffName}</span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.status === 'Active'
                            ? 'bg-[#D8EEE4] text-[#303B38]'
                            : s.status === 'Under Repair'
                            ? 'bg-[#FDECE7] text-[#F4A58F] border border-[#F4A58F]'
                            : 'bg-[#EADCCB] text-[#303B38]'
                        }`}
                      >
                        {s.status || 'Active'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-[#7F8983] max-w-[200px] truncate" title={s.remarks}>
                      {s.remarks || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setViewingSystem(s)}
                          title="View Details"
                          className="p-1.5 rounded-lg bg-[#F8F5EE] hover:bg-[#D8EEE4] text-[#303B38] transition cursor-pointer border border-[#E9E5DA]"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(s)}
                          title="Edit System"
                          className="p-1.5 rounded-lg bg-[#F8F5EE] hover:bg-[#D8EEE4] text-[#303B38] transition cursor-pointer border border-[#E9E5DA]"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id, s.systemName)}
                          title="Delete System"
                          className="p-1.5 rounded-lg bg-[#F8F5EE] hover:bg-[#FDECE7] text-[#7F8983] hover:text-[#F4A58F] transition cursor-pointer border border-[#E9E5DA]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit System Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#FFFDF7] border border-[#E9E5DA] rounded-3xl shadow-2xl w-full max-w-xl text-[#303B38] overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-[#F8F5EE] border-b border-[#E9E5DA] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-[#303B38]" />
                <h3 className="font-bold text-sm text-[#303B38]">
                  {editingSystem ? 'Edit IT System Details' : 'Add New IT System (Workstation)'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#7F8983] hover:text-[#303B38] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Branch Number */}
                <div className="space-y-1">
                  <label className="font-bold text-[#303B38]">Branch Number *</label>
                  <select
                    value={formBranch}
                    onChange={(e) => setFormBranch(parseInt(e.target.value, 10))}
                    className="w-full bg-[#FFFDF7] border border-[#E9E5DA] rounded-xl px-3 py-2 text-xs font-bold text-[#303B38] focus:outline-none focus:border-[#A8DCCB]"
                  >
                    {ALL_LOCATIONS.map((b) => (
                      <option key={b} value={b}>
                        {formatBranchLabel(b)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* System Name */}
                <div className="space-y-1">
                  <label className="font-bold text-[#303B38]">System / PC Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BR01-ADMIN-PC01"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-[#FFFDF7] border border-[#E9E5DA] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#303B38] focus:outline-none focus:border-[#A8DCCB]"
                  />
                </div>
              </div>

              {/* Processor & RAM */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-[#303B38]">Processor (CPU) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Intel Core i5-12400 (6 Cores, 4.40 GHz)"
                    value={formProcessor}
                    onChange={(e) => setFormProcessor(e.target.value)}
                    className="w-full bg-[#FFFDF7] border border-[#E9E5DA] rounded-xl px-3 py-2 text-xs text-[#303B38] focus:outline-none focus:border-[#A8DCCB]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#303B38]">RAM Memory *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 16GB DDR4 3200MHz"
                    value={formRam}
                    onChange={(e) => setFormRam(e.target.value)}
                    className="w-full bg-[#FFFDF7] border border-[#E9E5DA] rounded-xl px-3 py-2 text-xs text-[#303B38] focus:outline-none focus:border-[#A8DCCB]"
                  />
                </div>
              </div>

              {/* SSD & Windows Version */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-[#303B38]">SSD Storage *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 512GB NVMe M.2 SSD"
                    value={formSsd}
                    onChange={(e) => setFormSsd(e.target.value)}
                    className="w-full bg-[#FFFDF7] border border-[#E9E5DA] rounded-xl px-3 py-2 text-xs text-[#303B38] focus:outline-none focus:border-[#A8DCCB]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#303B38]">Windows Version *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Windows 11 Pro 64-bit"
                    value={formWin}
                    onChange={(e) => setFormWin(e.target.value)}
                    className="w-full bg-[#FFFDF7] border border-[#E9E5DA] rounded-xl px-3 py-2 text-xs text-[#303B38] focus:outline-none focus:border-[#A8DCCB]"
                  />
                </div>
              </div>

              {/* Assigned Staff Name & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-[#303B38]">Assigned Staff Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ahmed Al Mansoori (Store General Manager)"
                    value={formStaff}
                    onChange={(e) => setFormStaff(e.target.value)}
                    className="w-full bg-[#FFFDF7] border border-[#E9E5DA] rounded-xl px-3 py-2 text-xs font-bold text-[#303B38] focus:outline-none focus:border-[#A8DCCB]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#303B38]">Status *</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full bg-[#FFFDF7] border border-[#E9E5DA] rounded-xl px-3 py-2 text-xs font-bold text-[#303B38] focus:outline-none focus:border-[#A8DCCB]"
                  >
                    <option value="Active">Active (Operational)</option>
                    <option value="Under Repair">Under Repair</option>
                    <option value="Spare / Standby">Spare / Standby</option>
                  </select>
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-1">
                <label className="font-bold text-[#303B38]">Remarks (Location, notes)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Counter 1 Sales Desk, dual display cable connected."
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  className="w-full bg-[#FFFDF7] border border-[#E9E5DA] rounded-xl px-3 py-2 text-xs text-[#303B38] focus:outline-none focus:border-[#A8DCCB]"
                />
              </div>

              {/* Footer Buttons */}
              <div className="pt-3 border-t border-[#E9E5DA] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#FFFDF7] border border-[#E9E5DA] hover:bg-[#E9E5DA]/40 text-[#7F8983] font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#A8DCCB] to-[#BFDCCB] text-[#303B38] font-bold shadow-xs hover:opacity-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : editingSystem ? 'Save Changes' : 'Add System'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View System Details Modal */}
      {viewingSystem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#FFFDF7] border border-[#E9E5DA] rounded-3xl shadow-2xl w-full max-w-lg text-[#303B38] overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-[#F8F5EE] border-b border-[#E9E5DA] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-[#303B38]" />
                <h3 className="font-bold text-sm text-[#303B38]">
                  System Specifications: {viewingSystem.systemName}
                </h3>
              </div>
              <button
                onClick={() => setViewingSystem(null)}
                className="text-[#7F8983] hover:text-[#303B38] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 bg-[#F8F5EE] rounded-2xl border border-[#E9E5DA] space-y-2">
                <div className="flex justify-between border-b border-[#E9E5DA] pb-1.5">
                  <span className="text-[#7F8983]">Branch Assignment:</span>
                  <strong className="text-[#303B38]">{formatBranchLabel(viewingSystem.branchNumber)}</strong>
                </div>
                <div className="flex justify-between border-b border-[#E9E5DA] pb-1.5">
                  <span className="text-[#7F8983]">System / PC Name:</span>
                  <strong className="text-[#303B38] font-mono">{viewingSystem.systemName}</strong>
                </div>
                <div className="flex justify-between border-b border-[#E9E5DA] pb-1.5">
                  <span className="text-[#7F8983]">Processor (CPU):</span>
                  <span className="text-[#303B38] font-semibold">{viewingSystem.processor}</span>
                </div>
                <div className="flex justify-between border-b border-[#E9E5DA] pb-1.5">
                  <span className="text-[#7F8983]">RAM Memory:</span>
                  <strong className="text-[#303B38] font-mono">{viewingSystem.ram}</strong>
                </div>
                <div className="flex justify-between border-b border-[#E9E5DA] pb-1.5">
                  <span className="text-[#7F8983]">SSD Capacity:</span>
                  <strong className="text-[#303B38] font-mono">{viewingSystem.ssd}</strong>
                </div>
                <div className="flex justify-between border-b border-[#E9E5DA] pb-1.5">
                  <span className="text-[#7F8983]">Operating System:</span>
                  <span className="text-[#303B38]">{viewingSystem.windowsVersion}</span>
                </div>
                <div className="flex justify-between border-b border-[#E9E5DA] pb-1.5">
                  <span className="text-[#7F8983]">Assigned Staff:</span>
                  <strong className="text-[#303B38]">{viewingSystem.assignedStaffName}</strong>
                </div>
                <div className="flex justify-between border-b border-[#E9E5DA] pb-1.5">
                  <span className="text-[#7F8983]">Operational Status:</span>
                  <span className="font-bold text-[#303B38]">{viewingSystem.status || 'Active'}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-[#7F8983]">Remarks:</span>
                  <span className="text-[#303B38] text-right max-w-[240px]">{viewingSystem.remarks || 'None'}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setViewingSystem(null)}
                  className="px-4 py-2 rounded-xl bg-[#FFFDF7] border border-[#E9E5DA] hover:bg-[#E9E5DA]/40 text-[#303B38] font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
