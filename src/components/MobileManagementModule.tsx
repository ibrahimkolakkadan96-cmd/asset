import React, { useState, useMemo } from 'react';
import { useTracker } from '../context/TrackerContext';
import { MobileAsset, ALL_LOCATIONS, formatBranchLabel } from '../types';
import {
  Smartphone,
  Search,
  Plus,
  Building2,
  User,
  History,
  Calendar,
  ShieldCheck,
  ArrowRightLeft,
  Eye,
  Edit2,
  Trash2,
  X,
  Save,
  CheckCircle2,
  Filter,
  Check,
} from 'lucide-react';

export const MobileManagementModule: React.FC = () => {
  const {
    mobileAssets,
    mobileHistory,
    selectedBranch,
    setSelectedBranch,
    addMobileAsset,
    updateMobileAsset,
    deleteMobileAsset,
    transferMobileAsset,
  } = useTracker();

  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState<number | 'ALL'>(selectedBranch ?? 'ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingMobile, setEditingMobile] = useState<MobileAsset | null>(null);
  const [viewingMobile, setViewingMobile] = useState<MobileAsset | null>(null);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [mobileToTransfer, setMobileToTransfer] = useState<MobileAsset | null>(null);

  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [historyMobile, setHistoryMobile] = useState<MobileAsset | null>(null);

  // Form Fields
  const [formBrand, setFormBrand] = useState('Samsung');
  const [formModel, setFormModel] = useState('Galaxy A15');
  const [formImei1, setFormImei1] = useState('');
  const [formImei2, setFormImei2] = useState('');
  const [formSerial, setFormSerial] = useState('');
  const [formStaff, setFormStaff] = useState('');
  const [formBranch, setFormBranch] = useState<number>(selectedBranch || 1);
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formStatus, setFormStatus] = useState<MobileAsset['status']>('Assigned');
  const [formRemarks, setFormRemarks] = useState('');

  // Transfer Form Fields
  const [transferBranch, setTransferBranch] = useState<number>(1);
  const [transferStaff, setTransferStaff] = useState('');
  const [transferRemarks, setTransferRemarks] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered Mobiles
  const filteredMobiles = useMemo(() => {
    return mobileAssets.filter((m) => {
      if (branchFilter !== 'ALL' && m.branchNumber !== branchFilter) return false;
      if (statusFilter !== 'ALL' && m.status !== statusFilter) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const staff = m.assignedStaffName || m.staffName || '';
        const brand = m.brand || m.mobileBrand || '';
        const model = m.model || m.mobileModel || '';
        const match =
          m.imei1.toLowerCase().includes(q) ||
          (m.imei2 && m.imei2.toLowerCase().includes(q)) ||
          m.serialNumber.toLowerCase().includes(q) ||
          staff.toLowerCase().includes(q) ||
          brand.toLowerCase().includes(q) ||
          model.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [mobileAssets, branchFilter, statusFilter, searchQuery]);

  // Open Add
  const handleOpenAdd = () => {
    setEditingMobile(null);
    setFormBrand('Samsung');
    setFormModel('Galaxy A15');
    setFormImei1('');
    setFormImei2('');
    setFormSerial('');
    setFormStaff('');
    setFormBranch(typeof branchFilter === 'number' ? branchFilter : (selectedBranch || 1));
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormStatus('Assigned');
    setFormRemarks('');
    setErrorMessage('');
    setIsAddEditModalOpen(true);
  };

  // Open Edit
  const handleOpenEdit = (m: MobileAsset) => {
    setEditingMobile(m);
    setFormBrand(m.brand || m.mobileBrand || 'Samsung');
    setFormModel(m.model || m.mobileModel || 'Galaxy A15');
    setFormImei1(m.imei1);
    setFormImei2(m.imei2 || '');
    setFormSerial(m.serialNumber);
    setFormStaff(m.assignedStaffName || m.staffName || '');
    setFormBranch(m.branchNumber);
    setFormDate(m.assignedDate || new Date().toISOString().split('T')[0]);
    setFormStatus((m.status as any) || 'Assigned');
    setFormRemarks(m.remarks || '');
    setErrorMessage('');
    setIsAddEditModalOpen(true);
  };

  // Save (Add or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBrand.trim() || !formModel.trim()) {
      setErrorMessage('Brand and Model are required.');
      return;
    }
    if (!formImei1.trim()) {
      setErrorMessage('Primary IMEI 1 is required.');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      if (editingMobile) {
        const res = await updateMobileAsset(editingMobile.id, {
          brand: formBrand.trim(),
          model: formModel.trim(),
          imei1: formImei1.trim(),
          imei2: formImei2.trim() || undefined,
          serialNumber: formSerial.trim() || 'N/A',
          assignedStaffName: formStaff.trim() || 'Unassigned / Spare',
          branchNumber: formBranch,
          assignedDate: formDate,
          status: formStatus,
          remarks: formRemarks.trim(),
        });
        if (!res.success) {
          setErrorMessage(res.error || 'Failed to update mobile device.');
          return;
        }
      } else {
        const res = await addMobileAsset({
          brand: formBrand.trim(),
          model: formModel.trim(),
          imei1: formImei1.trim(),
          imei2: formImei2.trim() || undefined,
          serialNumber: formSerial.trim() || 'N/A',
          assignedStaffName: formStaff.trim() || 'Unassigned / Spare',
          branchNumber: formBranch,
          assignedDate: formDate,
          status: formStatus,
          remarks: formRemarks.trim(),
        });
        if (!res.success) {
          setErrorMessage(res.error || 'Failed to register mobile device.');
          return;
        }
      }
      setIsAddEditModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Transfer
  const handleOpenTransfer = (m: MobileAsset) => {
    setMobileToTransfer(m);
    setTransferBranch(m.branchNumber === 1 ? 2 : 1);
    setTransferStaff('');
    setTransferRemarks('Branch reallocation');
    setErrorMessage('');
    setIsTransferModalOpen(true);
  };

  // Execute Transfer
  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileToTransfer) return;
    if (!transferStaff.trim()) {
      setErrorMessage('Please specify the recipient staff name or "Branch Pool".');
      return;
    }
    setIsSubmitting(true);
    try {
      await transferMobileAsset({
        mobileId: mobileToTransfer.id,
        toBranch: transferBranch,
        newStaffName: transferStaff.trim(),
        remarks: transferRemarks.trim(),
      });
      setIsTransferModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // View History
  const handleOpenHistory = (m: MobileAsset) => {
    setHistoryMobile(m);
    setIsHistoryDrawerOpen(true);
  };

  // Delete
  const handleDelete = async (m: MobileAsset) => {
    if (window.confirm(`Delete mobile asset ${m.brand} ${m.model} (IMEI: ${m.imei1}) from Branch ${m.branchNumber}?`)) {
      await deleteMobileAsset(m.id);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F8F5EE]">
      {/* Header */}
      <div className="bg-[#FFFDF7] border-b border-[#E9E5DA] px-6 py-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#A8DCCB] to-[#BFDCCB] flex items-center justify-center text-[#303B38] shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#303B38] tracking-tight">
                Company Mobile Asset Management
              </h1>
              <p className="text-xs text-[#7F8983]">
                Strict IMEI tracking, branch allocations, dual SIM registration, and staff handovers (Branches 1-22)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#A8DCCB] to-[#BFDCCB] hover:opacity-95 text-[#303B38] text-xs font-bold shadow-xs cursor-pointer transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Mobile Asset</span>
            </button>
          </div>
        </div>

        {/* Filters Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-3 border-t border-[#E9E5DA]">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7F8983]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by IMEI 1, IMEI 2, S/N, Staff, Model..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#F8F5EE] border border-[#E9E5DA] rounded-xl text-xs text-[#303B38] placeholder-[#7F8983] focus:outline-none focus:ring-1 focus:ring-[#A8DCCB]"
            />
          </div>

          {/* Branch Filter */}
          <div className="flex items-center gap-2 bg-[#F8F5EE] border border-[#E9E5DA] rounded-xl px-3 py-1.5">
            <Building2 className="w-3.5 h-3.5 text-[#7F8983]" />
            <span className="text-[11px] font-semibold text-[#7F8983]">Branch:</span>
            <select
              value={branchFilter}
              onChange={(e) => {
                const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
                setBranchFilter(val);
                if (val !== 'ALL') setSelectedBranch(val);
              }}
              className="bg-transparent text-xs font-bold text-[#303B38] focus:outline-none cursor-pointer flex-1"
            >
              <option value="ALL">All Locations (Central + 22)</option>
              {ALL_LOCATIONS.map((b) => (
                <option key={b} value={b}>
                  {formatBranchLabel(b)}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 bg-[#F8F5EE] border border-[#E9E5DA] rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-[#7F8983]" />
            <span className="text-[11px] font-semibold text-[#7F8983]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-[#303B38] focus:outline-none cursor-pointer flex-1"
            >
              <option value="ALL">All Statuses</option>
              <option value="Assigned">Assigned</option>
              <option value="Available / In Stock">Available / In Stock</option>
              <option value="Under Repair">Under Repair</option>
              <option value="Decommissioned">Decommissioned</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="flex-1 flex flex-col overflow-hidden p-6">
        <div className="flex-1 bg-[#FFFDF7] rounded-2xl border border-[#E9E5DA] shadow-xs flex flex-col overflow-hidden">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#EADCCB]/30 text-[#303B38] border-b border-[#E9E5DA] sticky top-0 font-bold">
                <tr>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Device Model</th>
                  <th className="py-3 px-4">IMEI 1 (Primary)</th>
                  <th className="py-3 px-4">IMEI 2 (Secondary)</th>
                  <th className="py-3 px-4">Serial Number</th>
                  <th className="py-3 px-4">Assigned Staff</th>
                  <th className="py-3 px-4">Assigned Date</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E5DA]/60">
                {filteredMobiles.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-[#7F8983]">
                      <Smartphone className="w-8 h-8 mx-auto text-[#BFDCCB] mb-2 opacity-60" />
                      <p className="font-semibold text-xs">No mobile assets found.</p>
                      <p className="text-[11px] mt-0.5">Click "Register Mobile Asset" to add a new company phone.</p>
                    </td>
                  </tr>
                ) : (
                  filteredMobiles.map((mob) => (
                    <tr key={mob.id} className="hover:bg-[#F8F5EE]/60 transition group">
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#D8EEE4] text-[#303B38] border border-[#A8DCCB] text-[11px] font-bold">
                          <Building2 className="w-3 h-3" />
                          {formatBranchLabel(mob.branchNumber)}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-[#303B38]">
                        <div>{mob.brand} {mob.model}</div>
                        {mob.remarks && (
                          <div className="text-[10px] text-[#7F8983] truncate max-w-[180px] font-normal">{mob.remarks}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[#303B38] tracking-wider">
                        {mob.imei1}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#7F8983]">
                        {mob.imei2 || '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#7F8983]">
                        {mob.serialNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-semibold text-[#303B38]">
                          <User className="w-3.5 h-3.5 text-[#7F8983]" />
                          <span>{mob.assignedStaffName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[#7F8983]">
                        {mob.assignedDate || '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                            mob.status === 'Assigned'
                              ? 'bg-[#D8EEE4] text-[#303B38] border border-[#A8DCCB]'
                              : mob.status === 'Available / In Stock'
                              ? 'bg-[#BFDCCB]/60 text-[#303B38]'
                              : mob.status === 'Under Repair'
                              ? 'bg-[#FDECE7] text-[#F4A58F] border border-[#F4A58F]'
                              : 'bg-gray-100 text-[#7F8983]'
                          }`}
                        >
                          {mob.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenTransfer(mob)}
                            title="Reassign or Transfer to Branch"
                            className="p-1 rounded-lg text-[#303B38] hover:bg-[#D8EEE4] transition cursor-pointer"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenHistory(mob)}
                            title="View Handover History"
                            className="p-1 rounded-lg text-[#7F8983] hover:text-[#303B38] hover:bg-[#F8F5EE] transition cursor-pointer"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setViewingMobile(mob)}
                            title="View Details"
                            className="p-1 rounded-lg text-[#7F8983] hover:text-[#303B38] hover:bg-[#F8F5EE] transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(mob)}
                            title="Edit"
                            className="p-1 rounded-lg text-[#7F8983] hover:text-[#303B38] hover:bg-[#F8F5EE] transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(mob)}
                            title="Delete"
                            className="p-1 rounded-lg text-[#7F8983] hover:text-[#F4A58F] hover:bg-[#FDECE7] transition cursor-pointer"
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

          <div className="bg-[#EADCCB]/20 border-t border-[#E9E5DA] px-6 py-2.5 flex items-center justify-between text-xs text-[#7F8983]">
            <span>
              Registered Devices: <strong>{filteredMobiles.length}</strong> of <strong>{mobileAssets.length}</strong>
            </span>
            <span>
              Active Assignments: <strong>{mobileAssets.filter(m => m.status === 'Assigned').length}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Add / Edit Mobile Modal */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#303B38]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF7] w-full max-w-lg rounded-2xl border border-[#E9E5DA] shadow-xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-[#E9E5DA] flex items-center justify-between bg-gradient-to-r from-[#D8EEE4]/50 to-[#FFFDF7]">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#303B38]" />
                <h2 className="text-sm font-bold text-[#303B38]">
                  {editingMobile ? 'Edit Mobile Asset' : 'Register New Mobile Asset'}
                </h2>
              </div>
              <button onClick={() => setIsAddEditModalOpen(false)}>
                <X className="w-4 h-4 text-[#7F8983]" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-3.5 text-xs">
              {errorMessage && (
                <div className="p-2.5 rounded-xl bg-[#FDECE7] border border-[#F4A58F] text-[#F4A58F] font-semibold text-[11px]">
                  {errorMessage}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#303B38] mb-1">Brand *</label>
                  <input
                    type="text"
                    required
                    placeholder="Samsung / Apple / Xiaomi"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] text-[#303B38] font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#303B38] mb-1">Model *</label>
                  <input
                    type="text"
                    required
                    placeholder="Galaxy A15 / Redmi 12"
                    value={formModel}
                    onChange={(e) => setFormModel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] text-[#303B38] font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#303B38] mb-1">
                    IMEI 1 (Unique ID) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="15 digits (e.g. 358941098492019)"
                    value={formImei1}
                    onChange={(e) => setFormImei1(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] text-[#303B38] font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#303B38] mb-1">
                    IMEI 2 (Dual SIM)
                  </label>
                  <input
                    type="text"
                    placeholder="Optional 15 digits"
                    value={formImei2}
                    onChange={(e) => setFormImei2(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] text-[#303B38] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#303B38] mb-1">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    placeholder="Manufacturer Serial"
                    value={formSerial}
                    onChange={(e) => setFormSerial(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] text-[#303B38] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#303B38] mb-1">
                    Branch Assignment *
                  </label>
                  <select
                    value={formBranch}
                    onChange={(e) => setFormBranch(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] font-bold text-[#303B38]"
                  >
                    {ALL_LOCATIONS.map((b) => (
                      <option key={b} value={b}>
                        {formatBranchLabel(b)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#303B38] mb-1">
                    Assigned Staff Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tariq Mehmood"
                    value={formStaff}
                    onChange={(e) => setFormStaff(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] text-[#303B38] font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#303B38] mb-1">
                    Assigned Date
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] text-[#303B38]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#303B38] mb-1">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] font-bold text-[#303B38]"
                  >
                    <option value="Assigned">Assigned</option>
                    <option value="Available / In Stock">Available / In Stock</option>
                    <option value="Under Repair">Under Repair</option>
                    <option value="Decommissioned">Decommissioned</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#303B38] mb-1">
                    Remarks
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sales SIM bundle included"
                    value={formRemarks}
                    onChange={(e) => setFormRemarks(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] text-[#303B38]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E9E5DA]">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#F8F5EE] text-[#7F8983] font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#A8DCCB] to-[#BFDCCB] text-[#303B38] font-bold shadow-xs cursor-pointer hover:opacity-95"
                >
                  {isSubmitting ? 'Saving...' : editingMobile ? 'Update Mobile' : 'Register Mobile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer / Reassign Modal */}
      {isTransferModalOpen && mobileToTransfer && (
        <div className="fixed inset-0 z-50 bg-[#303B38]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF7] w-full max-w-md rounded-2xl border border-[#E9E5DA] shadow-xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E9E5DA] mb-3">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-[#303B38]" />
                <h3 className="text-xs font-bold text-[#303B38]">
                  Transfer / Handover Mobile Device
                </h3>
              </div>
              <button onClick={() => setIsTransferModalOpen(false)}>
                <X className="w-4 h-4 text-[#7F8983]" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="space-y-3 text-xs">
              {errorMessage && (
                <div className="p-2 rounded-lg bg-[#FDECE7] text-[#F4A58F] font-bold text-[11px]">
                  {errorMessage}
                </div>
              )}

              <div className="bg-[#F8F5EE] p-3 rounded-xl border border-[#E9E5DA] space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#7F8983]">Device:</span>
                  <strong className="text-[#303B38]">{mobileToTransfer.brand} {mobileToTransfer.model}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7F8983]">IMEI 1:</span>
                  <span className="font-mono text-[#303B38] font-semibold">{mobileToTransfer.imei1}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7F8983]">Current Holder:</span>
                  <span className="text-[#303B38]">{mobileToTransfer.assignedStaffName} ({formatBranchLabel(mobileToTransfer.branchNumber)})</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#303B38] mb-1">
                  Transfer To Location *
                </label>
                <select
                  value={transferBranch}
                  onChange={(e) => setTransferBranch(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] font-bold text-[#303B38]"
                >
                  {ALL_LOCATIONS.map((b) => (
                    <option key={b} value={b}>
                      {formatBranchLabel(b)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#303B38] mb-1">
                  New Assigned Staff Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Haris Siddiqui (Branch Manager)"
                  value={transferStaff}
                  onChange={(e) => setTransferStaff(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] text-[#303B38] font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#303B38] mb-1">
                  Transfer Remarks / Reason
                </label>
                <input
                  type="text"
                  placeholder="Staff branch transfer / Field replacement"
                  value={transferRemarks}
                  onChange={(e) => setTransferRemarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] text-[#303B38]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E9E5DA]">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-[#F8F5EE] text-[#7F8983] font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#A8DCCB] to-[#BFDCCB] text-[#303B38] font-bold shadow-xs cursor-pointer hover:opacity-95"
                >
                  {isSubmitting ? 'Transferring...' : 'Confirm Handover'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Handover History Drawer */}
      {isHistoryDrawerOpen && historyMobile && (
        <div className="fixed inset-0 z-50 bg-[#303B38]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF7] w-full max-w-lg rounded-2xl border border-[#E9E5DA] shadow-xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E9E5DA] mb-4">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#303B38]" />
                <h3 className="text-sm font-bold text-[#303B38]">
                  Assignment & Movement History
                </h3>
              </div>
              <button onClick={() => setIsHistoryDrawerOpen(false)}>
                <X className="w-4 h-4 text-[#7F8983]" />
              </button>
            </div>

            <div className="mb-4 bg-[#F8F5EE] p-3 rounded-xl border border-[#E9E5DA] text-xs">
              <div className="font-bold text-[#303B38]">{historyMobile.brand} {historyMobile.model}</div>
              <div className="font-mono text-[#7F8983] text-[11px] mt-0.5">IMEI: {historyMobile.imei1}</div>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {mobileHistory.filter((h) => h.mobileId === historyMobile.id).length === 0 ? (
                <p className="text-xs text-[#7F8983] text-center py-6">No historical handovers recorded.</p>
              ) : (
                mobileHistory
                  .filter((h) => h.mobileId === historyMobile.id)
                  .map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-[#FFFDF7] border border-[#E9E5DA] text-xs space-y-1 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#303B38] flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#A8DCCB]" />
                          {log.staffName}
                        </span>
                        <span className="text-[10px] text-[#7F8983]">{log.assignedDate}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[#7F8983]">
                        <span>{formatBranchLabel(log.branchNumber)}</span>
                        {log.returnedDate && (
                          <span className="text-[#F4A58F]">Returned: {log.returnedDate}</span>
                        )}
                      </div>
                      {log.remarks && (
                        <p className="text-[11px] text-[#7F8983] italic">{log.remarks}</p>
                      )}
                    </div>
                  ))
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-[#E9E5DA] flex justify-end">
              <button
                onClick={() => setIsHistoryDrawerOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#A8DCCB] to-[#BFDCCB] text-[#303B38] font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {viewingMobile && (
        <div className="fixed inset-0 z-50 bg-[#303B38]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF7] w-full max-w-md rounded-2xl border border-[#E9E5DA] shadow-xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E9E5DA] mb-4">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#303B38]" />
                <h3 className="text-sm font-bold text-[#303B38]">Mobile Asset Specifications</h3>
              </div>
              <button onClick={() => setViewingMobile(null)}>
                <X className="w-4 h-4 text-[#7F8983]" />
              </button>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-[#E9E5DA]/50">
                <span className="text-[#7F8983]">Device:</span>
                <strong className="text-[#303B38]">{viewingMobile.brand} {viewingMobile.model}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E9E5DA]/50">
                <span className="text-[#7F8983]">Primary IMEI 1:</span>
                <span className="font-mono font-bold text-[#303B38]">{viewingMobile.imei1}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E9E5DA]/50">
                <span className="text-[#7F8983]">Secondary IMEI 2:</span>
                <span className="font-mono text-[#303B38]">{viewingMobile.imei2 || 'None'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E9E5DA]/50">
                <span className="text-[#7F8983]">Serial Number:</span>
                <span className="font-mono text-[#303B38]">{viewingMobile.serialNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E9E5DA]/50">
                <span className="text-[#7F8983]">Assigned Staff:</span>
                <strong className="text-[#303B38]">{viewingMobile.assignedStaffName}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E9E5DA]/50">
                <span className="text-[#7F8983]">Branch Assignment:</span>
                <span className="font-bold text-[#303B38]">{formatBranchLabel(viewingMobile.branchNumber)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E9E5DA]/50">
                <span className="text-[#7F8983]">Assignment Date:</span>
                <span className="text-[#303B38]">{viewingMobile.assignedDate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E9E5DA]/50">
                <span className="text-[#7F8983]">Status:</span>
                <span className="font-bold text-[#303B38]">{viewingMobile.status}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E9E5DA]/50">
                <span className="text-[#7F8983]">Remarks:</span>
                <span className="text-[#303B38]">{viewingMobile.remarks || 'None'}</span>
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-[#E9E5DA] flex justify-end">
              <button
                onClick={() => setViewingMobile(null)}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#A8DCCB] to-[#BFDCCB] text-[#303B38] font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
