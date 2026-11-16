import React, { useState, useMemo } from 'react';
import { useTracker } from '../context/TrackerContext';
import { ITAccessoryItem, ALL_LOCATIONS, formatBranchLabel } from '../types';
import {
  Package,
  Search,
  Plus,
  Filter,
  ArrowRightLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  Building2,
  AlertTriangle,
  History,
  FolderPlus,
  Eye,
  Edit2,
  Trash2,
  X,
  Save,
  CheckCircle2,
  Layers,
} from 'lucide-react';

export const AccessoriesModule: React.FC = () => {
  const {
    accessoryCategories,
    accessoryItems,
    accessoryTransactions,
    selectedBranch,
    setSelectedBranch,
    addAccessoryCategory,
    addAccessoryItem,
    updateAccessoryItem,
    deleteAccessoryItem,
    accessoryStockIn,
    accessoryStockOut,
    accessoryTransfer,
  } = useTracker();

  // Tab: 'stock' | 'transfers' | 'categories'
  const [activeSubTab, setActiveSubTab] = useState<'stock' | 'transfers' | 'categories'>('stock');
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState<number | 'ALL'>(selectedBranch ?? 'ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ITAccessoryItem | null>(null);
  const [viewingItem, setViewingItem] = useState<ITAccessoryItem | null>(null);

  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [isStockOutModalOpen, setIsStockOutModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedItemForAction, setSelectedItemForAction] = useState<ITAccessoryItem | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Form states for Add/Edit
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Keyboard');
  const [formBrand, setFormBrand] = useState('Logitech');
  const [formModel, setFormModel] = useState('');
  const [formBranch, setFormBranch] = useState<number>(selectedBranch || 1);
  const [formCurrentStock, setFormCurrentStock] = useState<number>(10);
  const [formMinStock, setFormMinStock] = useState<number>(2);
  const [formLocation, setFormLocation] = useState('IT Server Room Cabinet B');
  const [formRemarks, setFormRemarks] = useState('');

  // Action Form States
  const [actionQty, setActionQty] = useState<number>(1);
  const [actionReceivedBy, setActionReceivedBy] = useState('');
  const [actionIssuedBy, setActionIssuedBy] = useState('IT Support');
  const [actionRemarks, setActionRemarks] = useState('');
  const [transferToBranch, setTransferToBranch] = useState<number>(2);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered accessory items
  const filteredItems = useMemo(() => {
    return accessoryItems.filter((item) => {
      if (branchFilter !== 'ALL' && item.branchNumber !== branchFilter) return false;
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const name = item.accessoryName || item.name || '';
        const cat = item.category || 'Accessory';
        const match =
          name.toLowerCase().includes(q) ||
          (item.brand || '').toLowerCase().includes(q) ||
          (item.model || '').toLowerCase().includes(q) ||
          cat.toLowerCase().includes(q) ||
          (item.storageLocation || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [accessoryItems, branchFilter, categoryFilter, searchQuery]);

  // Open Add/Edit Item
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormCategory(accessoryCategories[0]?.name || 'Keyboard');
    setFormBrand('');
    setFormModel('');
    setFormBranch(typeof branchFilter === 'number' ? branchFilter : (selectedBranch || 1));
    setFormCurrentStock(5);
    setFormMinStock(2);
    setFormLocation('IT Cabinet');
    setFormRemarks('');
    setErrorMessage('');
    setIsAddEditModalOpen(true);
  };

  const handleOpenEditModal = (item: ITAccessoryItem) => {
    setEditingItem(item);
    setFormName(item.accessoryName || item.name || '');
    setFormCategory(item.category || 'Keyboard');
    setFormBrand(item.brand || '');
    setFormModel(item.model || '');
    setFormBranch(item.branchNumber || item.branch || 1);
    setFormCurrentStock(item.currentStock);
    setFormMinStock(item.minimumStock);
    setFormLocation(item.storageLocation || 'IT Store');
    setFormRemarks(item.remarks || '');
    setErrorMessage('');
    setIsAddEditModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setErrorMessage('Accessory name is required.');
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await updateAccessoryItem(editingItem.id, {
          name: formName.trim(),
          category: formCategory,
          brand: formBrand.trim() || 'Generic',
          model: formModel.trim() || 'Standard',
          branchNumber: formBranch,
          currentStock: Math.max(0, formCurrentStock),
          minimumStock: Math.max(0, formMinStock),
          storageLocation: formLocation.trim() || 'General Store',
          remarks: formRemarks.trim(),
        });
      } else {
        await addAccessoryItem({
          name: formName.trim(),
          category: formCategory,
          brand: formBrand.trim() || 'Generic',
          model: formModel.trim() || 'Standard',
          branchNumber: formBranch,
          currentStock: Math.max(0, formCurrentStock),
          minimumStock: Math.max(0, formMinStock),
          storageLocation: formLocation.trim() || 'General Store',
          remarks: formRemarks.trim(),
        });
      }
      setIsAddEditModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stock IN handler
  const handleOpenStockIn = (item: ITAccessoryItem) => {
    setSelectedItemForAction(item);
    setActionQty(5);
    setActionReceivedBy(item.storageLocation || 'Store Room');
    setActionIssuedBy('Premier Central Procurement');
    setActionRemarks('Purchased new batch');
    setErrorMessage('');
    setIsStockInModalOpen(true);
  };

  const handleExecuteStockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForAction) return;
    if (actionQty <= 0) {
      setErrorMessage('Quantity must be greater than zero.');
      return;
    }
    const bNum = selectedItemForAction.branchNumber || selectedItemForAction.branch || 1;
    setIsSubmitting(true);
    try {
      await accessoryStockIn({
        accessoryId: selectedItemForAction.id,
        branchNumber: bNum,
        quantity: actionQty,
        receivedBy: actionReceivedBy.trim() || 'Warehouse Keeper',
        issuedBy: actionIssuedBy.trim() || 'IT Store',
        remarks: actionRemarks.trim() || 'Stock IN replenishment',
      });
      setIsStockInModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stock OUT handler
  const handleOpenStockOut = (item: ITAccessoryItem) => {
    setSelectedItemForAction(item);
    setActionQty(1);
    setActionReceivedBy('');
    setActionIssuedBy('IT Support Staff');
    setActionRemarks('Issued for workstation setup');
    setErrorMessage('');
    setIsStockOutModalOpen(true);
  };

  const handleExecuteStockOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForAction) return;
    if (actionQty <= 0) {
      setErrorMessage('Quantity must be at least 1 piece.');
      return;
    }
    if (actionQty > selectedItemForAction.currentStock) {
      setErrorMessage(`Cannot issue ${actionQty} units. Current stock at Branch ${selectedItemForAction.branchNumber} is only ${selectedItemForAction.currentStock} units.`);
      return;
    }
    const bNum = selectedItemForAction.branchNumber || selectedItemForAction.branch || 1;
    setIsSubmitting(true);
    try {
      const res = await accessoryStockOut({
        accessoryId: selectedItemForAction.id,
        branchNumber: bNum,
        quantity: actionQty,
        receivedBy: actionReceivedBy.trim() || 'Branch Staff',
        issuedBy: actionIssuedBy.trim() || 'IT Support',
        remarks: actionRemarks.trim(),
      });
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to issue accessory');
      } else {
        setIsStockOutModalOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Branch Transfer handler
  const handleOpenTransfer = (item: ITAccessoryItem) => {
    const itemBranch = item.branchNumber || item.branch || 1;
    setSelectedItemForAction(item);
    setActionQty(1);
    setTransferToBranch(itemBranch === 1 ? 2 : 1);
    setActionReceivedBy(`Branch ${itemBranch === 1 ? 2 : 1} Staff`);
    setActionIssuedBy('Central IT Depot');
    setActionRemarks('Inter-branch inventory transfer');
    setErrorMessage('');
    setIsTransferModalOpen(true);
  };

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForAction) return;
    const fromBranchNum = selectedItemForAction.branchNumber || selectedItemForAction.branch || 1;
    if (actionQty <= 0) {
      setErrorMessage('Quantity must be at least 1 piece.');
      return;
    }
    if (actionQty > selectedItemForAction.currentStock) {
      setErrorMessage(`Cannot transfer ${actionQty} units. Branch ${fromBranchNum} only holds ${selectedItemForAction.currentStock} units.`);
      return;
    }
    if (transferToBranch === fromBranchNum) {
      setErrorMessage('Destination branch must be different from source branch.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await accessoryTransfer({
        accessoryId: selectedItemForAction.id,
        fromBranch: fromBranchNum,
        toBranch: transferToBranch,
        quantity: actionQty,
        issuedBy: actionIssuedBy.trim() || 'IT Officer',
        receivedBy: actionReceivedBy.trim() || 'Branch Manager',
        remarks: actionRemarks.trim(),
      });
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to complete branch transfer');
      } else {
        setIsTransferModalOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Category creation
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    await addAccessoryCategory(newCategoryName.trim());
    setNewCategoryName('');
    setIsCategoryModalOpen(false);
  };

  // Delete item with confirmation
  const handleDeleteItem = async (item: ITAccessoryItem) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}" from Branch ${item.branchNumber}? This action cannot be undone.`)) {
      await deleteAccessoryItem(item.id);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F8F5EE]">
      {/* Top Header & Subtabs */}
      <div className="bg-[#FFFDF7] border-b border-[#E9E5DA] px-6 py-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#A8DCCB] to-[#BFDCCB] flex items-center justify-center text-[#303B38] shadow-xs">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-[#303B38] tracking-tight">
                  IT Accessories Management
                </h1>
                <p className="text-xs text-[#7F8983]">
                  Peripheral hardware stock tracking across all 22 branches (Keyboards, Mice, Monitors, Cables, UPS, Phones)
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#BFDCCB] bg-[#FFFDF7] hover:bg-[#F8F5EE] text-[#303B38] text-xs font-semibold shadow-xs cursor-pointer transition"
            >
              <FolderPlus className="w-3.5 h-3.5 text-[#303B38]" />
              <span>Add Category</span>
            </button>
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#A8DCCB] to-[#BFDCCB] hover:opacity-95 text-[#303B38] text-xs font-bold shadow-xs cursor-pointer transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Accessory Item</span>
            </button>
          </div>
        </div>

        {/* Sub Navigation Strip */}
        <div className="flex items-center justify-between gap-4 mt-4 pt-3 border-t border-[#E9E5DA]">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveSubTab('stock')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'stock'
                  ? 'bg-[#A8DCCB] text-[#303B38] font-bold shadow-xs'
                  : 'text-[#7F8983] hover:text-[#303B38] hover:bg-[#EADCCB]/30'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Inventory Stock ({accessoryItems.length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('transfers')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'transfers'
                  ? 'bg-[#A8DCCB] text-[#303B38] font-bold shadow-xs'
                  : 'text-[#7F8983] hover:text-[#303B38] hover:bg-[#EADCCB]/30'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Transfer & Movement Logs ({accessoryTransactions.length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('categories')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'categories'
                  ? 'bg-[#A8DCCB] text-[#303B38] font-bold shadow-xs'
                  : 'text-[#7F8983] hover:text-[#303B38] hover:bg-[#EADCCB]/30'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Categories ({accessoryCategories.length})</span>
            </button>
          </div>

          {/* Quick stats */}
          <div className="hidden lg:flex items-center gap-4 text-xs text-[#7F8983]">
            <span>
              Total Units: <strong className="text-[#303B38]">{accessoryItems.reduce((acc, i) => acc + i.currentStock, 0)}</strong>
            </span>
            <span>•</span>
            <span>
              Low Stock Alert: <strong className="text-[#F4A58F] font-bold">{accessoryItems.filter(i => i.currentStock <= i.minimumStock).length}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeSubTab === 'stock' && (
        <div className="flex-1 flex flex-col overflow-hidden p-6 space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#FFFDF7] p-3 rounded-2xl border border-[#E9E5DA] shadow-xs">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7F8983]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search accessories by name, brand, model, storage location..."
                className="w-full pl-9 pr-4 py-2 bg-[#F8F5EE] border border-[#E9E5DA] rounded-xl text-xs text-[#303B38] placeholder-[#7F8983] focus:outline-none focus:ring-1 focus:ring-[#A8DCCB]"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Category Filter */}
              <div className="flex items-center gap-1.5 bg-[#F8F5EE] border border-[#E9E5DA] rounded-xl px-2.5 py-1.5">
                <span className="text-[11px] font-semibold text-[#7F8983]">Category:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-[#303B38] focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Categories</option>
                  {accessoryCategories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Branch Filter */}
              <div className="flex items-center gap-1.5 bg-[#F8F5EE] border border-[#E9E5DA] rounded-xl px-2.5 py-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#7F8983]" />
                <span className="text-[11px] font-semibold text-[#7F8983]">Branch:</span>
                <select
                  value={branchFilter}
                  onChange={(e) => {
                    const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
                    setBranchFilter(val);
                    if (val !== 'ALL') setSelectedBranch(val);
                  }}
                  className="bg-transparent text-xs font-bold text-[#303B38] focus:outline-none cursor-pointer"
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
          </div>

          {/* Table Container */}
          <div className="flex-1 bg-[#FFFDF7] rounded-2xl border border-[#E9E5DA] shadow-xs flex flex-col overflow-hidden">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#EADCCB]/30 text-[#303B38] border-b border-[#E9E5DA] sticky top-0 z-10 font-bold">
                  <tr>
                    <th className="py-3 px-4">Branch</th>
                    <th className="py-3 px-4">Accessory Item</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Brand & Model</th>
                    <th className="py-3 px-4 text-center">Current Stock</th>
                    <th className="py-3 px-4 text-center">Min Level</th>
                    <th className="py-3 px-4">Storage Location</th>
                    <th className="py-3 px-4 text-center">Stock Actions</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9E5DA]/60">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-[#7F8983]">
                        <Package className="w-8 h-8 mx-auto text-[#BFDCCB] mb-2 opacity-60" />
                        <p className="font-semibold text-xs">No IT accessories found matching your criteria.</p>
                        <p className="text-[11px] mt-0.5">Try adjusting filters or click "Add Accessory Item" above.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const isZero = item.currentStock === 0;
                      const isLow = !isZero && item.currentStock <= item.minimumStock;

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-[#F8F5EE]/60 transition-colors group"
                        >
                          <td className="py-3 px-4 font-bold text-[#303B38]">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#D8EEE4] text-[#303B38] border border-[#A8DCCB] text-[11px]">
                              <Building2 className="w-3 h-3" />
                              {formatBranchLabel(item.branchNumber)}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-[#303B38]">
                            <div className="flex items-center gap-2">
                              <span>{item.name}</span>
                              {isZero && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#F4A58F] text-white">
                                  ZERO STOCK
                                </span>
                              )}
                              {isLow && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FDECE7] text-[#F4A58F] border border-[#F4A58F]">
                                  LOW STOCK
                                </span>
                              )}
                            </div>
                            {item.remarks && (
                              <p className="text-[10px] text-[#7F8983] truncate max-w-xs">{item.remarks}</p>
                            )}
                          </td>
                          <td className="py-3 px-4 text-[#7F8983]">{item.category}</td>
                          <td className="py-3 px-4 text-[#303B38]">
                            <span className="font-medium">{item.brand}</span>{' '}
                            <span className="text-[#7F8983]">({item.model})</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-lg font-bold text-xs ${
                                isZero
                                  ? 'bg-[#F4A58F] text-white shadow-xs'
                                  : isLow
                                  ? 'bg-[#FDECE7] text-[#F4A58F] border border-[#F4A58F]'
                                  : 'bg-[#D8EEE4] text-[#303B38]'
                              }`}
                            >
                              {item.currentStock} pcs
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center text-[#7F8983] font-medium">
                            {item.minimumStock} pcs
                          </td>
                          <td className="py-3 px-4 text-[#7F8983] truncate max-w-[160px]">
                            {item.storageLocation}
                          </td>

                          {/* Quick Stock Operations */}
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleOpenStockIn(item)}
                                title="Stock IN (Add items)"
                                className="px-2 py-1 rounded-lg bg-[#D8EEE4] hover:bg-[#A8DCCB] text-[#303B38] font-bold text-[11px] flex items-center gap-1 cursor-pointer transition shadow-xs"
                              >
                                <ArrowDownToLine className="w-3 h-3 text-[#303B38]" />
                                <span>IN</span>
                              </button>
                              <button
                                onClick={() => handleOpenStockOut(item)}
                                title="Stock OUT (Issue item to user/office)"
                                className="px-2 py-1 rounded-lg bg-[#F8F5EE] hover:bg-[#EADCCB] text-[#303B38] font-bold text-[11px] flex items-center gap-1 cursor-pointer transition border border-[#E9E5DA]"
                              >
                                <ArrowUpFromLine className="w-3 h-3 text-[#303B38]" />
                                <span>OUT</span>
                              </button>
                              <button
                                onClick={() => handleOpenTransfer(item)}
                                title="Branch Transfer"
                                className="px-2 py-1 rounded-lg bg-[#FFFDF7] hover:bg-[#F8F5EE] text-[#303B38] font-bold text-[11px] flex items-center gap-1 cursor-pointer transition border border-[#BFDCCB]"
                              >
                                <ArrowRightLeft className="w-3 h-3 text-[#303B38]" />
                                <span>Transfer</span>
                              </button>
                            </div>
                          </td>

                          {/* Item Edit/View/Delete */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setViewingItem(item)}
                                title="View Details"
                                className="p-1 rounded-lg text-[#7F8983] hover:text-[#303B38] hover:bg-[#F8F5EE] transition cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenEditModal(item)}
                                title="Edit Item"
                                className="p-1 rounded-lg text-[#7F8983] hover:text-[#303B38] hover:bg-[#F8F5EE] transition cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item)}
                                title="Delete Item"
                                className="p-1 rounded-lg text-[#7F8983] hover:text-[#F4A58F] hover:bg-[#FDECE7] transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer summary */}
            <div className="bg-[#EADCCB]/20 border-t border-[#E9E5DA] px-6 py-2.5 flex items-center justify-between text-xs text-[#7F8983]">
              <span>
                Showing <strong>{filteredItems.length}</strong> of <strong>{accessoryItems.length}</strong> accessory records
              </span>
              <span>
                Branch Coverage: <strong>{branchFilter === 'ALL' ? 'All 22 Branches' : `Branch ${branchFilter}`}</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Transfers and Movement Logs Subtab */}
      {activeSubTab === 'transfers' && (
        <div className="flex-1 flex flex-col overflow-hidden p-6 space-y-4">
          <div className="bg-[#FFFDF7] rounded-2xl border border-[#E9E5DA] p-4 shadow-xs flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#303B38]">
                Accessory Movement & Inter-Branch Transfer Audit Log
              </h2>
              <p className="text-xs text-[#7F8983]">
                Full historical audit trail of Stock IN, Stock OUT, and transfers between branches 1-22
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-[#D8EEE4] text-[#303B38] rounded-xl border border-[#A8DCCB]">
              {accessoryTransactions.length} Total Logs
            </span>
          </div>

          <div className="flex-1 bg-[#FFFDF7] rounded-2xl border border-[#E9E5DA] shadow-xs flex flex-col overflow-hidden">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#EADCCB]/30 text-[#303B38] border-b border-[#E9E5DA] sticky top-0 font-bold">
                  <tr>
                    <th className="py-3 px-4">Date / Time</th>
                    <th className="py-3 px-4">Movement Type</th>
                    <th className="py-3 px-4">Accessory Item</th>
                    <th className="py-3 px-4 text-center">From Branch</th>
                    <th className="py-3 px-4 text-center">To Branch</th>
                    <th className="py-3 px-4 text-center">Quantity</th>
                    <th className="py-3 px-4">Issued By</th>
                    <th className="py-3 px-4">Received By</th>
                    <th className="py-3 px-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9E5DA]/60">
                  {accessoryTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-[#7F8983]">
                        No accessory transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    accessoryTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-[#F8F5EE]/60 transition">
                        <td className="py-3 px-4 text-[#7F8983]">
                          {tx.date || tx.createdAt || tx.issueDate ? new Date(tx.date || tx.createdAt || tx.issueDate || '').toLocaleDateString() : 'Today'}{' '}
                          {tx.date || tx.createdAt || tx.issueDate ? new Date(tx.date || tx.createdAt || tx.issueDate || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md font-bold text-[11px] ${
                              tx.type === 'TRANSFER'
                                ? 'bg-[#D8EEE4] text-[#303B38] border border-[#A8DCCB]'
                                : tx.type === 'IN'
                                ? 'bg-[#BFDCCB]/60 text-[#303B38]'
                                : 'bg-[#FDECE7] text-[#F4A58F] border border-[#F4A58F]'
                            }`}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#303B38]">
                          {tx.accessoryName}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-[#303B38]">
                          {tx.fromBranch ? `Branch ${tx.fromBranch}` : `Branch ${tx.branchNumber}`}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-[#303B38]">
                          {tx.toBranch ? `Branch ${tx.toBranch}` : '—'}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-[#303B38]">
                          {tx.quantity} pcs
                        </td>
                        <td className="py-3 px-4 text-[#7F8983]">{tx.issuedBy}</td>
                        <td className="py-3 px-4 text-[#303B38] font-medium">{tx.receivedBy}</td>
                        <td className="py-3 px-4 text-[#7F8983] max-w-xs truncate">{tx.remarks || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Categories Subtab */}
      {activeSubTab === 'categories' && (
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="bg-[#FFFDF7] rounded-2xl border border-[#E9E5DA] p-4 shadow-xs flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#303B38]">
                Peripheral Hardware Categories
              </h2>
              <p className="text-xs text-[#7F8983]">
                Manage standard accessory types. You can create custom categories dynamically as required.
              </p>
            </div>
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#A8DCCB] to-[#BFDCCB] text-[#303B38] text-xs font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {accessoryCategories.map((cat) => {
              const count = accessoryItems.filter((i) => i.category === cat.name).length;
              return (
                <div
                  key={cat.id}
                  className="bg-[#FFFDF7] p-4 rounded-2xl border border-[#E9E5DA] shadow-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#D8EEE4] text-[#303B38] flex items-center justify-center font-bold">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-[#303B38]">{cat.name}</h3>
                      <p className="text-[11px] text-[#7F8983]">{count} registered items</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setCategoryFilter(cat.name);
                      setActiveSubTab('stock');
                    }}
                    className="text-xs font-semibold text-[#303B38] hover:underline"
                  >
                    View
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: Add / Edit Accessory Item */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#303B38]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF7] w-full max-w-lg rounded-2xl border border-[#E9E5DA] shadow-xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-[#E9E5DA] flex items-center justify-between bg-gradient-to-r from-[#D8EEE4]/50 to-[#FFFDF7]">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[#303B38]" />
                <h2 className="text-sm font-bold text-[#303B38]">
                  {editingItem ? 'Edit Accessory Item' : 'Add New Accessory Item'}
                </h2>
              </div>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="text-[#7F8983] hover:text-[#303B38] p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 space-y-3.5 text-xs">
              {errorMessage && (
                <div className="p-2.5 rounded-xl bg-[#FDECE7] border border-[#F4A58F] text-[#F4A58F] font-semibold text-[11px]">
                  {errorMessage}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
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

                <div>
                  <label className="block text-[11px] font-bold text-[#303B38] mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] font-bold text-[#303B38]"
                  >
                    {accessoryCategories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#303B38] mb-1">
                  Accessory Item Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Logitech Wireless Optical Mouse"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] text-[#303B38]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#303B38] mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    placeholder="Logitech / Dell / HP"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] text-[#303B38]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#303B38] mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    placeholder="M185 / E2222H"
                    value={formModel}
                    onChange={(e) => setFormModel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] text-[#303B38]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#303B38] mb-1">
                    Current Stock (pcs) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formCurrentStock}
                    onChange={(e) => setFormCurrentStock(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] font-bold text-[#303B38]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#303B38] mb-1">
                    Minimum Alert Level (pcs) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] font-bold text-[#303B38]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#303B38] mb-1">
                  Storage Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Branch IT Storage Cabinet Shelf 3"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] text-[#303B38]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#303B38] mb-1">
                  Remarks / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional specifications or supplier information..."
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] text-[#303B38]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E9E5DA]">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#F8F5EE] text-[#7F8983] hover:text-[#303B38] font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#A8DCCB] to-[#BFDCCB] text-[#303B38] font-bold shadow-xs cursor-pointer hover:opacity-95"
                >
                  {isSubmitting ? 'Saving...' : editingItem ? 'Update Accessory' : 'Save Accessory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Stock IN Modal */}
      {isStockInModalOpen && selectedItemForAction && (
        <div className="fixed inset-0 z-50 bg-[#303B38]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF7] w-full max-w-md rounded-2xl border border-[#E9E5DA] shadow-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#E9E5DA] flex items-center justify-between bg-gradient-to-r from-[#D8EEE4] to-[#FFFDF7]">
              <div className="flex items-center gap-2">
                <ArrowDownToLine className="w-5 h-5 text-[#303B38]" />
                <h3 className="text-xs font-bold text-[#303B38]">
                  Stock IN: {selectedItemForAction.name} ({formatBranchLabel(selectedItemForAction.branchNumber)})
                </h3>
              </div>
              <button onClick={() => setIsStockInModalOpen(false)}>
                <X className="w-4 h-4 text-[#7F8983]" />
              </button>
            </div>

            <form onSubmit={handleExecuteStockIn} className="p-5 space-y-3 text-xs">
              {errorMessage && (
                <div className="p-2 rounded-lg bg-[#FDECE7] text-[#F4A58F] font-bold text-[11px]">
                  {errorMessage}
                </div>
              )}

              <div className="bg-[#F8F5EE] p-3 rounded-xl border border-[#E9E5DA] text-[11px] text-[#7F8983] flex justify-between">
                <span>Current Stock: <strong className="text-[#303B38]">{selectedItemForAction.currentStock} pcs</strong></span>
                <span>Location: <strong className="text-[#303B38]">{formatBranchLabel(selectedItemForAction.branchNumber)}</strong></span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#303B38] mb-1">Quantity to Add (pcs) *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={actionQty}
                  onChange={(e) => setActionQty(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] font-bold text-[#303B38]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#303B38] mb-1">Issued By / Supplier *</label>
                <input
                  type="text"
                  required
                  value={actionIssuedBy}
                  onChange={(e) => setActionIssuedBy(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] text-[#303B38]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#303B38] mb-1">Received By (Staff / Store) *</label>
                <input
                  type="text"
                  required
                  value={actionReceivedBy}
                  onChange={(e) => setActionReceivedBy(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] text-[#303B38]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#303B38] mb-1">Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. PO-8891 / Central Warehouse Delivery"
                  value={actionRemarks}
                  onChange={(e) => setActionRemarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] text-[#303B38]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E9E5DA]">
                <button
                  type="button"
                  onClick={() => setIsStockInModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-[#F8F5EE] text-[#7F8983] font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#A8DCCB] to-[#BFDCCB] text-[#303B38] font-bold shadow-xs cursor-pointer hover:opacity-95"
                >
                  {isSubmitting ? 'Processing...' : 'Confirm Stock IN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Stock OUT Modal */}
      {isStockOutModalOpen && selectedItemForAction && (
        <div className="fixed inset-0 z-50 bg-[#303B38]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF7] w-full max-w-md rounded-2xl border border-[#E9E5DA] shadow-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#E9E5DA] flex items-center justify-between bg-gradient-to-r from-[#FDECE7] to-[#FFFDF7]">
              <div className="flex items-center gap-2">
                <ArrowUpFromLine className="w-5 h-5 text-[#F4A58F]" />
                <h3 className="text-xs font-bold text-[#303B38]">
                  Stock OUT: {selectedItemForAction.name} ({formatBranchLabel(selectedItemForAction.branchNumber)})
                </h3>
              </div>
              <button onClick={() => setIsStockOutModalOpen(false)}>
                <X className="w-4 h-4 text-[#7F8983]" />
              </button>
            </div>

            <form onSubmit={handleExecuteStockOut} className="p-5 space-y-3 text-xs">
              {errorMessage && (
                <div className="p-2 rounded-lg bg-[#FDECE7] text-[#F4A58F] font-bold text-[11px]">
                  {errorMessage}
                </div>
              )}

              <div className="bg-[#F8F5EE] p-3 rounded-xl border border-[#E9E5DA] text-[11px] text-[#7F8983] flex justify-between">
                <span>Available Stock: <strong className="text-[#303B38]">{selectedItemForAction.currentStock} pcs</strong></span>
                <span>Location: <strong className="text-[#303B38]">{formatBranchLabel(selectedItemForAction.branchNumber)}</strong></span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#303B38] mb-1">Quantity to Issue (pcs) *</label>
                <input
                  type="number"
                  min={1}
                  max={selectedItemForAction.currentStock}
                  required
                  value={actionQty}
                  onChange={(e) => setActionQty(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] font-bold text-[#303B38]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#303B38] mb-1">Issued To Staff / Dept *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tariq Mehmood (Sales Desk)"
                  value={actionReceivedBy}
                  onChange={(e) => setActionReceivedBy(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] text-[#303B38]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#303B38] mb-1">Issued By (IT Staff) *</label>
                <input
                  type="text"
                  required
                  value={actionIssuedBy}
                  onChange={(e) => setActionIssuedBy(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] text-[#303B38]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#303B38] mb-1">Reason / Remarks</label>
                <input
                  type="text"
                  placeholder="Replacement for faulty mouse / New workstation"
                  value={actionRemarks}
                  onChange={(e) => setActionRemarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] text-[#303B38]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E9E5DA]">
                <button
                  type="button"
                  onClick={() => setIsStockOutModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-[#F8F5EE] text-[#7F8983] font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#F4A58F] to-[#e89078] text-white font-bold shadow-xs cursor-pointer hover:opacity-95"
                >
                  {isSubmitting ? 'Processing...' : 'Confirm Stock OUT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Branch Transfer Modal */}
      {isTransferModalOpen && selectedItemForAction && (
        <div className="fixed inset-0 z-50 bg-[#303B38]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF7] w-full max-w-md rounded-2xl border border-[#E9E5DA] shadow-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#E9E5DA] flex items-center justify-between bg-gradient-to-r from-[#D8EEE4] to-[#FFFDF7]">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-[#303B38]" />
                <h3 className="text-xs font-bold text-[#303B38]">
                  Inter-Branch Transfer: {selectedItemForAction.name}
                </h3>
              </div>
              <button onClick={() => setIsTransferModalOpen(false)}>
                <X className="w-4 h-4 text-[#7F8983]" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="p-5 space-y-3 text-xs">
              {errorMessage && (
                <div className="p-2 rounded-lg bg-[#FDECE7] text-[#F4A58F] font-bold text-[11px]">
                  {errorMessage}
                </div>
              )}

              {/* Source & Destination Branches */}
              <div className="grid grid-cols-2 gap-3 bg-[#F8F5EE] p-3 rounded-xl border border-[#E9E5DA]">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#7F8983] block">From Location</span>
                  <strong className="text-xs text-[#303B38]">{formatBranchLabel(selectedItemForAction.branchNumber)}</strong>
                  <span className="block text-[10px] text-[#7F8983] mt-0.5">Avail: {selectedItemForAction.currentStock} pcs</span>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-[#7F8983] block mb-1">To Location *</label>
                  <select
                    value={transferToBranch}
                    onChange={(e) => setTransferToBranch(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded-lg bg-[#FFFDF7] border border-[#E9E5DA] font-bold text-[#303B38]"
                  >
                    {ALL_LOCATIONS.filter((b) => b !== selectedItemForAction.branchNumber).map((b) => (
                      <option key={b} value={b}>
                        {formatBranchLabel(b)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#303B38] mb-1">Quantity to Transfer (pcs) *</label>
                <input
                  type="number"
                  min={1}
                  max={selectedItemForAction.currentStock}
                  required
                  value={actionQty}
                  onChange={(e) => setActionQty(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] font-bold text-[#303B38]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#303B38] mb-1">Issued By *</label>
                  <input
                    type="text"
                    required
                    value={actionIssuedBy}
                    onChange={(e) => setActionIssuedBy(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] text-[#303B38]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#303B38] mb-1">Received By *</label>
                  <input
                    type="text"
                    required
                    placeholder="Branch Rep Name"
                    value={actionReceivedBy}
                    onChange={(e) => setActionReceivedBy(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] text-[#303B38]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#303B38] mb-1">Transfer Remarks / Waybill</label>
                <input
                  type="text"
                  placeholder="e.g. Urgent stock rebalancing for new counter"
                  value={actionRemarks}
                  onChange={(e) => setActionRemarks(e.target.value)}
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
                  {isSubmitting ? 'Transferring...' : 'Execute Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Create Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#303B38]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF7] w-full max-w-sm rounded-2xl border border-[#E9E5DA] shadow-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-[#303B38]">Create Accessory Category</h3>
              <button onClick={() => setIsCategoryModalOpen(false)}>
                <X className="w-4 h-4 text-[#7F8983]" />
              </button>
            </div>
            <form onSubmit={handleAddCategory} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#303B38] mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. USB Hubs / Display Adapters"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] text-[#303B38]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-[#F8F5EE] text-[#7F8983] font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#A8DCCB] to-[#BFDCCB] text-[#303B38] font-bold shadow-xs cursor-pointer"
                >
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: View Details Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-[#303B38]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF7] w-full max-w-md rounded-2xl border border-[#E9E5DA] shadow-xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E9E5DA] mb-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[#303B38]" />
                <h3 className="text-sm font-bold text-[#303B38]">Accessory Specification</h3>
              </div>
              <button onClick={() => setViewingItem(null)}>
                <X className="w-4 h-4 text-[#7F8983]" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-[#E9E5DA]/50">
                <span className="text-[#7F8983]">Item Name:</span>
                <strong className="text-[#303B38]">{viewingItem.name}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E9E5DA]/50">
                <span className="text-[#7F8983]">Category:</span>
                <span className="font-semibold text-[#303B38]">{viewingItem.category}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E9E5DA]/50">
                <span className="text-[#7F8983]">Brand & Model:</span>
                <span className="font-semibold text-[#303B38]">{viewingItem.brand} {viewingItem.model}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E9E5DA]/50">
                <span className="text-[#7F8983]">Assigned Branch:</span>
                <strong className="text-[#303B38]">{formatBranchLabel(viewingItem.branchNumber)}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E9E5DA]/50">
                <span className="text-[#7F8983]">Current Stock:</span>
                <span className="font-bold text-[#303B38]">{viewingItem.currentStock} pcs</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E9E5DA]/50">
                <span className="text-[#7F8983]">Min Alert Stock:</span>
                <span className="text-[#7F8983]">{viewingItem.minimumStock} pcs</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E9E5DA]/50">
                <span className="text-[#7F8983]">Storage Location:</span>
                <span className="text-[#303B38] font-medium">{viewingItem.storageLocation}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E9E5DA]/50">
                <span className="text-[#7F8983]">Remarks:</span>
                <span className="text-[#303B38]">{viewingItem.remarks || 'None'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#7F8983]">Last Updated:</span>
                <span className="text-[#7F8983]">{new Date(viewingItem.updatedAt).toLocaleString()}</span>
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-[#E9E5DA] flex justify-end">
              <button
                onClick={() => setViewingItem(null)}
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
