import React, { useState, useMemo } from 'react';
import { useTracker } from '../context/TrackerContext';
import { CompanyLaptop, ALL_LOCATIONS, formatBranchLabel } from '../types';
import {
  Laptop,
  Search,
  Plus,
  Building2,
  User,
  History,
  Cpu,
  HardDrive,
  Monitor,
  ArrowRightLeft,
  Eye,
  Edit2,
  Trash2,
  X,
  Save,
  CheckCircle2,
  Filter,
  FileSpreadsheet,
} from 'lucide-react';

export const LaptopManagementModule: React.FC = () => {
  const {
    laptops,
    laptopHistory,
    selectedBranch,
    setSelectedBranch,
    addLaptop,
    updateLaptop,
    deleteLaptop,
    transferLaptop,
  } = useTracker();

  const [activeSubView, setActiveSubView] = useState<'list' | 'specs_report'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState<number | 'ALL'>(selectedBranch ?? 'ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingLaptop, setEditingLaptop] = useState<CompanyLaptop | null>(null);
  const [viewingLaptop, setViewingLaptop] = useState<CompanyLaptop | null>(null);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [laptopToTransfer, setLaptopToTransfer] = useState<CompanyLaptop | null>(null);

  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [historyLaptop, setHistoryLaptop] = useState<CompanyLaptop | null>(null);

  // Form Fields
  const [formBrand, setFormBrand] = useState('Dell');
  const [formModel, setFormModel] = useState('Latitude 5430');
  const [formSerial, setFormSerial] = useState('');
  const [formProcessor, setFormProcessor] = useState('Intel Core i5-1245U (10 Cores, 4.40 GHz)');
  const [formRam, setFormRam] = useState('16GB DDR4');
  const [formSsd, setFormSsd] = useState('512GB NVMe M.2 SSD');
  const [formWindows, setFormWindows] = useState('Windows 11 Pro 64-bit');
  const [formStaff, setFormStaff] = useState('');
  const [formBranch, setFormBranch] = useState<number>(selectedBranch || 1);
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formStatus, setFormStatus] = useState<CompanyLaptop['status']>('Assigned');
  const [formRemarks, setFormRemarks] = useState('');

  // Transfer Fields
  const [transferBranch, setTransferBranch] = useState<number>(1);
  const [transferStaff, setTransferStaff] = useState('');
  const [transferRemarks, setTransferRemarks] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered Laptops
  const filteredLaptops = useMemo(() => {
    return laptops.filter((lap) => {
      if (branchFilter !== 'ALL' && lap.branchNumber !== branchFilter) return false;
      if (statusFilter !== 'ALL' && lap.status !== statusFilter) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const staff = lap.assignedStaffName || lap.staffName || '';
        const brand = lap.brand || lap.laptopBrand || '';
        const model = lap.model || lap.laptopModel || '';
        const match =
          lap.serialNumber.toLowerCase().includes(q) ||
          staff.toLowerCase().includes(q) ||
          brand.toLowerCase().includes(q) ||
          model.toLowerCase().includes(q) ||
          (lap.processor || '').toLowerCase().includes(q) ||
          (lap.ram || '').toLowerCase().includes(q) ||
          (lap.ssd || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [laptops, branchFilter, statusFilter, searchQuery]);

  // Open Add
  const handleOpenAdd = () => {
    setEditingLaptop(null);
    setFormBrand('Dell');
    setFormModel('Latitude 5430');
    setFormSerial('');
    setFormProcessor('Intel Core i5-1245U (10 Cores, 4.40 GHz)');
    setFormRam('16GB DDR4');
    setFormSsd('512GB NVMe M.2 SSD');
    setFormWindows('Windows 11 Pro 64-bit');
    setFormStaff('');
    setFormBranch(typeof branchFilter === 'number' ? branchFilter : (selectedBranch || 1));
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormStatus('Assigned');
    setFormRemarks('');
    setErrorMessage('');
    setIsAddEditModalOpen(true);
  };

  // Open Edit
  const handleOpenEdit = (lap: CompanyLaptop) => {
    setEditingLaptop(lap);
    setFormBrand(lap.brand || lap.laptopBrand || 'Dell');
    setFormModel(lap.model || lap.laptopModel || 'Latitude 5430');
    setFormSerial(lap.serialNumber);
    setFormProcessor(lap.processor || '');
    setFormRam(lap.ram || '');
    setFormSsd(lap.ssd || '');
    setFormWindows(lap.windowsVersion || 'Windows 11 Pro 64-bit');
    setFormStaff(lap.assignedStaffName || lap.staffName || '');
    setFormBranch(lap.branchNumber);
    setFormDate(lap.assignedDate || new Date().toISOString().split('T')[0]);
    setFormStatus((lap.status as any) || 'Assigned');
    setFormRemarks(lap.remarks || '');
    setErrorMessage('');
    setIsAddEditModalOpen(true);
  };

  // Save Laptop
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBrand.trim() || !formModel.trim()) {
      setErrorMessage('Brand and Model are required.');
      return;
    }
    if (!formSerial.trim()) {
      setErrorMessage('Serial Number is required.');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      if (editingLaptop) {
        await updateLaptop(editingLaptop.id, {
          brand: formBrand.trim(),
          model: formModel.trim(),
          serialNumber: formSerial.trim(),
          processor: formProcessor.trim(),
          ram: formRam.trim(),
          ssd: formSsd.trim(),
          windowsVersion: formWindows.trim(),
          assignedStaffName: formStaff.trim() || 'Unassigned / IT Standby',
          branchNumber: formBranch,
          assignedDate: formDate,
          status: formStatus,
          remarks: formRemarks.trim(),
        });
      } else {
        const res = await addLaptop({
          brand: formBrand.trim(),
          model: formModel.trim(),
          serialNumber: formSerial.trim(),
          processor: formProcessor.trim(),
          ram: formRam.trim(),
          ssd: formSsd.trim(),
          windowsVersion: formWindows.trim(),
          assignedStaffName: formStaff.trim() || 'Unassigned / IT Standby',
          branchNumber: formBranch,
          assignedDate: formDate,
          status: formStatus,
          remarks: formRemarks.trim(),
        });
        if (!res.success) {
          setErrorMessage(res.error || 'Failed to register laptop.');
          return;
        }
      }
      setIsAddEditModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Transfer
  const handleOpenTransfer = (lap: CompanyLaptop) => {
    setLaptopToTransfer(lap);
    setTransferBranch(lap.branchNumber === 1 ? 2 : 1);
    setTransferStaff('');
    setTransferRemarks('Branch laptop reallocation');
    setErrorMessage('');
    setIsTransferModalOpen(true);
  };

  // Execute Transfer
  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!laptopToTransfer) return;
    if (!transferStaff.trim()) {
      setErrorMessage('Please specify the recipient staff name.');
      return;
    }
    setIsSubmitting(true);
    try {
      await transferLaptop({
        laptopId: laptopToTransfer.id,
        toBranch: transferBranch,
        newStaffName: transferStaff.trim(),
        remarks: transferRemarks.trim(),
      });
      setIsTransferModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open History
  const handleOpenHistory = (lap: CompanyLaptop) => {
    setHistoryLaptop(lap);
    setIsHistoryDrawerOpen(true);
  };

  // Delete
  const handleDelete = async (lap: CompanyLaptop) => {
    if (window.confirm(`Delete laptop ${lap.brand} ${lap.model} (S/N: ${lap.serialNumber}) at Branch ${lap.branchNumber}?`)) {
      await deleteLaptop(lap.id);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F8F5EE]">
      {/* Header */}
      <div className="bg-[#FFFDF7] border-b border-[#E9E5DA] px-6 py-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#A8DCCB] to-[#BFDCCB] flex items-center justify-center text-[#303B38] shadow-xs">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#303B38] tracking-tight">
                Company Laptop Management
              </h1>
              <p className="text-xs text-[#7F8983]">
                Full CPU, RAM, SSD, and Windows OS specifications, serial numbers, and employee assignments (Branches 1-22)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubView(activeSubView === 'list' ? 'specs_report' : 'list')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#BFDCCB] bg-[#FFFDF7] hover:bg-[#F8F5EE] text-[#303B38] text-xs font-semibold shadow-xs cursor-pointer transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#303B38]" />
              <span>{activeSubView === 'list' ? 'Hardware Specs Matrix' : 'Back to Asset List'}</span>
            </button>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#A8DCCB] to-[#BFDCCB] hover:opacity-95 text-[#303B38] text-xs font-bold shadow-xs cursor-pointer transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Laptop</span>
            </button>
          </div>
        </div>

        {/* Filter Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-3 border-t border-[#E9E5DA]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7F8983]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by S/N, Staff, Processor, RAM, SSD, Model..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#F8F5EE] border border-[#E9E5DA] rounded-xl text-xs text-[#303B38] placeholder-[#7F8983] focus:outline-none focus:ring-1 focus:ring-[#A8DCCB]"
            />
          </div>

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
              <option value="Under Maintenance">Under Maintenance</option>
              <option value="Decommissioned">Decommissioned</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeSubView === 'list' ? (
        <div className="flex-1 flex flex-col overflow-hidden p-6">
          <div className="flex-1 bg-[#FFFDF7] rounded-2xl border border-[#E9E5DA] shadow-xs flex flex-col overflow-hidden">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#EADCCB]/30 text-[#303B38] border-b border-[#E9E5DA] sticky top-0 font-bold">
                  <tr>
                    <th className="py-3 px-4">Branch</th>
                    <th className="py-3 px-4">Laptop Model</th>
                    <th className="py-3 px-4">Serial Number</th>
                    <th className="py-3 px-4">Processor & RAM</th>
                    <th className="py-3 px-4">SSD & Windows OS</th>
                    <th className="py-3 px-4">Assigned Staff</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9E5DA]/60">
                  {filteredLaptops.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-[#7F8983]">
                        <Laptop className="w-8 h-8 mx-auto text-[#BFDCCB] mb-2 opacity-60" />
                        <p className="font-semibold text-xs">No company laptops found.</p>
                        <p className="text-[11px] mt-0.5">Click "Register Laptop" to add a new notebook.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredLaptops.map((lap) => (
                      <tr key={lap.id} className="hover:bg-[#F8F5EE]/60 transition group">
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#D8EEE4] text-[#303B38] border border-[#A8DCCB] text-[11px] font-bold">
                            <Building2 className="w-3 h-3" />
                            {formatBranchLabel(lap.branchNumber)}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-[#303B38]">
                          <div>{lap.brand} {lap.model}</div>
                          {lap.remarks && (
                            <div className="text-[10px] text-[#7F8983] truncate max-w-[180px] font-normal">{lap.remarks}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-[#303B38]">
                          {lap.serialNumber}
                        </td>
                        <td className="py-3 px-4 text-[#303B38]">
                          <div className="flex items-center gap-1 font-medium">
                            <Cpu className="w-3 h-3 text-[#7F8983]" />
                            <span>{lap.processor}</span>
                          </div>
                          <div className="text-[10px] text-[#7F8983] mt-0.5">
                            RAM: <strong className="text-[#303B38]">{lap.ram}</strong>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[#303B38]">
                          <div className="flex items-center gap-1 font-medium">
                            <HardDrive className="w-3 h-3 text-[#7F8983]" />
                            <span>{lap.ssd}</span>
                          </div>
                          <div className="text-[10px] text-[#7F8983] mt-0.5">
                            OS: <strong className="text-[#303B38]">{lap.windowsVersion}</strong>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 font-semibold text-[#303B38]">
                            <User className="w-3.5 h-3.5 text-[#7F8983]" />
                            <span>{lap.assignedStaffName}</span>
                          </div>
                          <div className="text-[10px] text-[#7F8983]">
                            Since: {lap.assignedDate || '—'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                              lap.status === 'Assigned'
                                ? 'bg-[#D8EEE4] text-[#303B38] border border-[#A8DCCB]'
                                : lap.status === 'Available / In Stock'
                                ? 'bg-[#BFDCCB]/60 text-[#303B38]'
                                : lap.status === 'Under Maintenance'
                                ? 'bg-[#FDECE7] text-[#F4A58F] border border-[#F4A58F]'
                                : 'bg-gray-100 text-[#7F8983]'
                            }`}
                          >
                            {lap.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenTransfer(lap)}
                              title="Reassign or Transfer to Branch"
                              className="p-1 rounded-lg text-[#303B38] hover:bg-[#D8EEE4] transition cursor-pointer"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenHistory(lap)}
                              title="View Assignment History"
                              className="p-1 rounded-lg text-[#7F8983] hover:text-[#303B38] hover:bg-[#F8F5EE] transition cursor-pointer"
                            >
                              <History className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setViewingLaptop(lap)}
                              title="View Details"
                              className="p-1 rounded-lg text-[#7F8983] hover:text-[#303B38] hover:bg-[#F8F5EE] transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(lap)}
                              title="Edit"
                              className="p-1 rounded-lg text-[#7F8983] hover:text-[#303B38] hover:bg-[#F8F5EE] transition cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(lap)}
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
                Registered Laptops: <strong>{filteredLaptops.length}</strong> of <strong>{laptops.length}</strong>
              </span>
              <span>
                Deployed: <strong>{laptops.filter(l => l.status === 'Assigned').length}</strong> | In Stock: <strong>{laptops.filter(l => l.status === 'Available / In Stock').length}</strong>
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Branch-wise Hardware Specs Report View */
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="bg-[#FFFDF7] rounded-2xl border border-[#E9E5DA] p-4 shadow-xs flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#303B38]">
                Branch-wise Laptop Hardware Specifications Breakdown
              </h2>
              <p className="text-xs text-[#7F8983]">
                Executive summary of processor tiers, RAM allocations, and operating systems across Branches 1 to 22
              </p>
            </div>
            <button
              onClick={() => setActiveSubView('list')}
              className="px-3 py-1.5 rounded-xl bg-[#A8DCCB] text-[#303B38] font-bold text-xs shadow-xs"
            >
              Back to Table
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ALL_LOCATIONS.map((b) => {
              const branchLaptops = laptops.filter((l) => l.branchNumber === b);
              return (
                <div
                  key={b}
                  className="bg-[#FFFDF7] rounded-2xl border border-[#E9E5DA] p-4 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E9E5DA]">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#7F8983]" />
                        <h3 className="font-bold text-xs text-[#303B38]">{formatBranchLabel(b)}</h3>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-[#D8EEE4] text-[#303B38] font-bold text-[11px]">
                        {branchLaptops.length} Laptops
                      </span>
                    </div>

                    {branchLaptops.length === 0 ? (
                      <p className="text-[11px] text-[#7F8983] py-4 text-center">No laptops assigned to this branch.</p>
                    ) : (
                      <div className="space-y-2 text-[11px]">
                        {branchLaptops.map((l) => (
                          <div key={l.id} className="p-2 bg-[#F8F5EE] rounded-xl border border-[#E9E5DA]/60">
                            <div className="font-bold text-[#303B38] flex justify-between">
                              <span>{l.brand} {l.model}</span>
                              <span className="text-[#7F8983] font-mono">{l.serialNumber}</span>
                            </div>
                            <div className="text-[10px] text-[#7F8983] mt-1 flex justify-between">
                              <span>{l.processor}</span>
                              <span>{l.ram} / {l.ssd}</span>
                            </div>
                            <div className="text-[10px] font-semibold text-[#303B38] mt-1">
                              Staff: {l.assignedStaffName}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#303B38]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF7] w-full max-w-lg rounded-2xl border border-[#E9E5DA] shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[#E9E5DA] flex items-center justify-between bg-gradient-to-r from-[#D8EEE4]/50 to-[#FFFDF7]">
              <div className="flex items-center gap-2">
                <Laptop className="w-5 h-5 text-[#303B38]" />
                <h2 className="text-sm font-bold text-[#303B38]">
                  {editingLaptop ? 'Edit Company Laptop' : 'Register New Company Laptop'}
                </h2>
              </div>
              <button onClick={() => setIsAddEditModalOpen(false)}>
                <X className="w-4 h-4 text-[#7F8983]" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-3 text-xs overflow-y-auto flex-1">
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
                    placeholder="Dell / Lenovo / HP"
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
                    placeholder="Latitude 5430 / ThinkPad T14"
                    value={formModel}
                    onChange={(e) => setFormModel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] text-[#303B38] font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#303B38] mb-1">
                    Hardware Serial Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 8K9L2M3"
                    value={formSerial}
                    onChange={(e) => setFormSerial(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] text-[#303B38] font-mono font-bold"
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

              <div>
                <label className="block text-[11px] font-bold text-[#303B38] mb-1">Processor (CPU) *</label>
                <input
                  type="text"
                  required
                  placeholder="Intel Core i5-1245U / Intel Core i7-1365U / AMD Ryzen 7"
                  value={formProcessor}
                  onChange={(e) => setFormProcessor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] text-[#303B38]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#303B38] mb-1">RAM *</label>
                  <input
                    type="text"
                    required
                    placeholder="16GB DDR4 / 32GB DDR5"
                    value={formRam}
                    onChange={(e) => setFormRam(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] text-[#303B38]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#303B38] mb-1">SSD Storage *</label>
                  <input
                    type="text"
                    required
                    placeholder="512GB NVMe / 1TB NVMe"
                    value={formSsd}
                    onChange={(e) => setFormSsd(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] text-[#303B38]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#303B38] mb-1">Windows OS Version *</label>
                <input
                  type="text"
                  required
                  placeholder="Windows 11 Pro 64-bit"
                  value={formWindows}
                  onChange={(e) => setFormWindows(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] text-[#303B38]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#303B38] mb-1">
                    Assigned Staff Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Salim Al-Harthy"
                    value={formStaff}
                    onChange={(e) => setFormStaff(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] text-[#303B38] font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#303B38] mb-1">
                    Assignment Date
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
                    <option value="Under Maintenance">Under Maintenance</option>
                    <option value="Decommissioned">Decommissioned</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#303B38] mb-1">
                    Remarks
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Includes Dell USB-C Dock and Charger"
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
                  {isSubmitting ? 'Saving...' : editingLaptop ? 'Update Laptop' : 'Register Laptop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {isTransferModalOpen && laptopToTransfer && (
        <div className="fixed inset-0 z-50 bg-[#303B38]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF7] w-full max-w-md rounded-2xl border border-[#E9E5DA] shadow-xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E9E5DA] mb-3">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-[#303B38]" />
                <h3 className="text-xs font-bold text-[#303B38]">
                  Transfer / Reassign Company Laptop
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
                  <span className="text-[#7F8983]">Laptop:</span>
                  <strong className="text-[#303B38]">{laptopToTransfer.brand} {laptopToTransfer.model}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7F8983]">Serial Number:</span>
                  <span className="font-mono text-[#303B38] font-semibold">{laptopToTransfer.serialNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7F8983]">Current User:</span>
                  <span className="text-[#303B38]">{laptopToTransfer.assignedStaffName} ({formatBranchLabel(laptopToTransfer.branchNumber)})</span>
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
                  placeholder="e.g. Khalid Al-Amri (Senior Auditor)"
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
                  placeholder="Management rotation / Site reassignment"
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
                  {isSubmitting ? 'Transferring...' : 'Confirm Reassignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Drawer */}
      {isHistoryDrawerOpen && historyLaptop && (
        <div className="fixed inset-0 z-50 bg-[#303B38]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF7] w-full max-w-lg rounded-2xl border border-[#E9E5DA] shadow-xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E9E5DA] mb-4">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#303B38]" />
                <h3 className="text-sm font-bold text-[#303B38]">
                  Laptop Assignment & Movement History
                </h3>
              </div>
              <button onClick={() => setIsHistoryDrawerOpen(false)}>
                <X className="w-4 h-4 text-[#7F8983]" />
              </button>
            </div>

            <div className="mb-4 bg-[#F8F5EE] p-3 rounded-xl border border-[#E9E5DA] text-xs">
              <div className="font-bold text-[#303B38]">{historyLaptop.brand} {historyLaptop.model}</div>
              <div className="font-mono text-[#7F8983] text-[11px] mt-0.5">S/N: {historyLaptop.serialNumber}</div>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {laptopHistory.filter((h) => h.laptopId === historyLaptop.id).length === 0 ? (
                <p className="text-xs text-[#7F8983] text-center py-6">No historical assignments recorded.</p>
              ) : (
                laptopHistory
                  .filter((h) => h.laptopId === historyLaptop.id)
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
      {viewingLaptop && (
        <div className="fixed inset-0 z-50 bg-[#303B38]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF7] w-full max-w-md rounded-2xl border border-[#E9E5DA] shadow-xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E9E5DA] mb-4">
              <div className="flex items-center gap-2">
                <Laptop className="w-5 h-5 text-[#303B38]" />
                <h3 className="text-sm font-bold text-[#303B38]">Laptop Hardware Profile</h3>
              </div>
              <button onClick={() => setViewingLaptop(null)}>
                <X className="w-4 h-4 text-[#7F8983]" />
              </button>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-[#E9E5DA]/50">
                <span className="text-[#7F8983]">Model:</span>
                <strong className="text-[#303B38]">{viewingLaptop.brand} {viewingLaptop.model}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E9E5DA]/50">
                <span className="text-[#7F8983]">Serial Number:</span>
                <span className="font-mono font-bold text-[#303B38]">{viewingLaptop.serialNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E9E5DA]/50">
                <span className="text-[#7F8983]">Processor (CPU):</span>
                <span className="text-[#303B38] font-medium">{viewingLaptop.processor}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E9E5DA]/50">
                <span className="text-[#7F8983]">Installed RAM:</span>
                <strong className="text-[#303B38]">{viewingLaptop.ram}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E9E5DA]/50">
                <span className="text-[#7F8983]">Storage (SSD):</span>
                <strong className="text-[#303B38]">{viewingLaptop.ssd}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E9E5DA]/50">
                <span className="text-[#7F8983]">Operating System:</span>
                <span className="text-[#303B38]">{viewingLaptop.windowsVersion}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E9E5DA]/50">
                <span className="text-[#7F8983]">Assigned Staff:</span>
                <strong className="text-[#303B38]">{viewingLaptop.assignedStaffName}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E9E5DA]/50">
                <span className="text-[#7F8983]">Assigned Branch:</span>
                <span className="font-bold text-[#303B38]">{formatBranchLabel(viewingLaptop.branchNumber)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E9E5DA]/50">
                <span className="text-[#7F8983]">Status:</span>
                <span className="font-bold text-[#303B38]">{viewingLaptop.status}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E9E5DA]/50">
                <span className="text-[#7F8983]">Remarks:</span>
                <span className="text-[#303B38]">{viewingLaptop.remarks || 'None'}</span>
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-[#E9E5DA] flex justify-end">
              <button
                onClick={() => setViewingLaptop(null)}
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
