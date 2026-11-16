import React, { useState, useMemo } from 'react';
import { useTracker } from '../context/TrackerContext';
import { CustomAssetCategory, CustomAssetItem, CustomFieldDefinition, ALL_LOCATIONS, formatBranchLabel } from '../types';
import {
  Layers,
  Search,
  Plus,
  Building2,
  Settings,
  FolderPlus,
  Trash2,
  Edit2,
  Eye,
  ArrowRightLeft,
  X,
  Save,
  CheckCircle2,
  Filter,
} from 'lucide-react';

export const CustomAssetModule: React.FC = () => {
  const {
    customCategories,
    customAssets,
    selectedBranch,
    setSelectedBranch,
    addCustomCategory,
    deleteCustomCategory,
    addCustomAsset,
    updateCustomAsset,
    deleteCustomAsset,
  } = useTracker();

  const [activeTab, setActiveTab] = useState<'assets' | 'categories'>('assets');
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState<number | 'ALL'>(selectedBranch ?? 'ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Modals
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<CustomAssetItem | null>(null);
  const [viewingAsset, setViewingAsset] = useState<CustomAssetItem | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Asset Form State
  const [formName, setFormName] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formBranch, setFormBranch] = useState<number>(selectedBranch || 1);
  const [formSerial, setFormSerial] = useState('');
  const [formStatus, setFormStatus] = useState<CustomAssetItem['status']>('Active');
  const [formRemarks, setFormRemarks] = useState('');
  const [formCustomValues, setFormCustomValues] = useState<Record<string, any>>({});

  // Category Builder State
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatFields, setNewCatFields] = useState<CustomFieldDefinition[]>([
    { id: 'f1', name: 'Serial / Model', type: 'text', required: true },
    { id: 'f2', name: 'IP Address / Tag', type: 'text', required: false },
  ]);

  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Current selected category for asset creation
  const activeCategory = useMemo(() => {
    return customCategories.find((c) => c.id === formCategoryId) || customCategories[0];
  }, [customCategories, formCategoryId]);

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return customAssets.filter((a) => {
      if (branchFilter !== 'ALL' && a.branchNumber !== branchFilter) return false;
      if (categoryFilter !== 'ALL' && a.categoryId !== categoryFilter) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const assetTitle = a.name || a.assetName || '';
        const match =
          assetTitle.toLowerCase().includes(q) ||
          (a.serialNumber && a.serialNumber.toLowerCase().includes(q)) ||
          (a.categoryName && a.categoryName.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [customAssets, branchFilter, categoryFilter, searchQuery]);

  // Open Add Asset
  const handleOpenAddAsset = () => {
    setEditingAsset(null);
    const firstCat = customCategories[0];
    setFormCategoryId(firstCat ? firstCat.id : '');
    setFormName('');
    setFormBranch(typeof branchFilter === 'number' ? branchFilter : (selectedBranch || 1));
    setFormSerial('');
    setFormStatus('Active');
    setFormRemarks('');
    setFormCustomValues({});
    setErrorMessage('');
    setIsAssetModalOpen(true);
  };

  // Open Edit Asset
  const handleOpenEditAsset = (asset: CustomAssetItem) => {
    setEditingAsset(asset);
    setFormCategoryId(asset.categoryId);
    setFormName(asset.name || asset.assetName || '');
    setFormBranch(asset.branchNumber);
    setFormSerial(asset.serialNumber || '');
    setFormStatus(asset.status);
    setFormRemarks(asset.remarks || '');
    setFormCustomValues(asset.customFieldValues || {});
    setErrorMessage('');
    setIsAssetModalOpen(true);
  };

  // Save Asset
  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setErrorMessage('Asset Name is required.');
      return;
    }
    const cat = customCategories.find((c) => c.id === formCategoryId);
    if (!cat) {
      setErrorMessage('Please select a valid custom category.');
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingAsset) {
        await updateCustomAsset(editingAsset.id, {
          name: formName.trim(),
          categoryId: cat.id,
          categoryName: cat.name,
          branchNumber: formBranch,
          serialNumber: formSerial.trim(),
          status: formStatus,
          remarks: formRemarks.trim(),
          customFieldValues: formCustomValues,
        });
      } else {
        await addCustomAsset({
          name: formName.trim(),
          categoryId: cat.id,
          categoryName: cat.name,
          branchNumber: formBranch,
          serialNumber: formSerial.trim(),
          status: formStatus,
          remarks: formRemarks.trim(),
          customFieldValues: formCustomValues,
        });
      }
      setIsAssetModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Asset
  const handleDeleteAsset = async (asset: CustomAssetItem) => {
    if (window.confirm(`Delete custom asset "${asset.name}" from Branch ${asset.branchNumber}?`)) {
      await deleteCustomAsset(asset.id);
    }
  };

  // Category Builder: Add Field
  const handleAddFieldToCat = () => {
    setNewCatFields([
      ...newCatFields,
      {
        id: `f_${Date.now()}`,
        name: `Field ${newCatFields.length + 1}`,
        type: 'text',
        required: false,
      },
    ]);
  };

  const handleRemoveFieldFromCat = (index: number) => {
    setNewCatFields(newCatFields.filter((_, i) => i !== index));
  };

  // Save Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setIsSubmitting(true);
    try {
      await addCustomCategory({
        name: newCatName.trim(),
        description: newCatDesc.trim() || undefined,
        customFields: newCatFields.filter((f) => f.name.trim() !== ''),
      });
      setNewCatName('');
      setNewCatDesc('');
      setIsCategoryModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (cat: CustomAssetCategory) => {
    const assignedAssets = customAssets.filter((a) => a.categoryId === cat.id);
    if (assignedAssets.length > 0) {
      alert(`Cannot delete category "${cat.name}". It still contains ${assignedAssets.length} active custom assets.`);
      return;
    }
    if (window.confirm(`Delete custom category "${cat.name}"?`)) {
      await deleteCustomCategory(cat.id);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F8F5EE]">
      {/* Header */}
      <div className="bg-[#FFFDF7] border-b border-[#E9E5DA] px-6 py-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#A8DCCB] to-[#BFDCCB] flex items-center justify-center text-[#303B38] shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#303B38] tracking-tight">
                Custom Asset Management
              </h1>
              <p className="text-xs text-[#7F8983]">
                Dynamic categories and custom specifications for specialized branch hardware (Barcode scanners, Biometrics, Switches)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#BFDCCB] bg-[#FFFDF7] hover:bg-[#F8F5EE] text-[#303B38] text-xs font-semibold shadow-xs cursor-pointer transition"
            >
              <FolderPlus className="w-3.5 h-3.5 text-[#303B38]" />
              <span>Define Category & Fields</span>
            </button>
            <button
              onClick={handleOpenAddAsset}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#A8DCCB] to-[#BFDCCB] hover:opacity-95 text-[#303B38] text-xs font-bold shadow-xs cursor-pointer transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Asset</span>
            </button>
          </div>
        </div>

        {/* Tab strip */}
        <div className="flex items-center justify-between gap-4 mt-4 pt-3 border-t border-[#E9E5DA]">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('assets')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'assets'
                  ? 'bg-[#A8DCCB] text-[#303B38] font-bold shadow-xs'
                  : 'text-[#7F8983] hover:text-[#303B38] hover:bg-[#EADCCB]/30'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Custom Assets ({customAssets.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'categories'
                  ? 'bg-[#A8DCCB] text-[#303B38] font-bold shadow-xs'
                  : 'text-[#7F8983] hover:text-[#303B38] hover:bg-[#EADCCB]/30'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Category Schema ({customCategories.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#7F8983]">
              Active Categories: <strong className="text-[#303B38]">{customCategories.length}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main View */}
      {activeTab === 'assets' ? (
        <div className="flex-1 flex flex-col overflow-hidden p-6 space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#FFFDF7] p-3 rounded-2xl border border-[#E9E5DA] shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7F8983]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search custom assets by name, tag, category..."
                className="w-full pl-9 pr-4 py-2 bg-[#F8F5EE] border border-[#E9E5DA] rounded-xl text-xs text-[#303B38] placeholder-[#7F8983] focus:outline-none focus:ring-1 focus:ring-[#A8DCCB]"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-[#F8F5EE] border border-[#E9E5DA] rounded-xl px-2.5 py-1.5">
                <span className="text-[11px] font-semibold text-[#7F8983]">Category:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-[#303B38] focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Categories</option>
                  {customCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

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

          {/* Table */}
          <div className="flex-1 bg-[#FFFDF7] rounded-2xl border border-[#E9E5DA] shadow-xs flex flex-col overflow-hidden">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#EADCCB]/30 text-[#303B38] border-b border-[#E9E5DA] sticky top-0 font-bold">
                  <tr>
                    <th className="py-3 px-4">Branch</th>
                    <th className="py-3 px-4">Asset Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Serial / Tag</th>
                    <th className="py-3 px-4">Custom Attributes</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9E5DA]/60">
                  {filteredAssets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#7F8983]">
                        <Layers className="w-8 h-8 mx-auto text-[#BFDCCB] mb-2 opacity-60" />
                        <p className="font-semibold text-xs">No custom assets recorded yet.</p>
                        <p className="text-[11px] mt-0.5">Click "Add Custom Asset" to register a specialized device.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredAssets.map((asset) => (
                      <tr key={asset.id} className="hover:bg-[#F8F5EE]/60 transition group">
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#D8EEE4] text-[#303B38] border border-[#A8DCCB] text-[11px] font-bold">
                            <Building2 className="w-3 h-3" />
                            {formatBranchLabel(asset.branchNumber)}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-[#303B38]">
                          <div>{asset.name}</div>
                          {asset.remarks && (
                            <div className="text-[10px] text-[#7F8983] truncate max-w-xs font-normal">{asset.remarks}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-medium text-[#7F8983]">
                          {asset.categoryName}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#303B38]">
                          {asset.serialNumber || '—'}
                        </td>
                        <td className="py-3 px-4 text-[#303B38]">
                          {asset.customFieldValues && Object.keys(asset.customFieldValues).length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(asset.customFieldValues).map(([k, v]) => (
                                <span
                                  key={k}
                                  className="px-1.5 py-0.5 rounded bg-[#F8F5EE] border border-[#E9E5DA] text-[10px]"
                                >
                                  <strong>{k}:</strong> {String(v)}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[#7F8983]">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                              asset.status === 'Active'
                                ? 'bg-[#D8EEE4] text-[#303B38] border border-[#A8DCCB]'
                                : asset.status === 'In Stock'
                                ? 'bg-[#BFDCCB]/60 text-[#303B38]'
                                : 'bg-[#FDECE7] text-[#F4A58F] border border-[#F4A58F]'
                            }`}
                          >
                            {asset.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setViewingAsset(asset)}
                              title="View Details"
                              className="p-1 rounded-lg text-[#7F8983] hover:text-[#303B38] hover:bg-[#F8F5EE] transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEditAsset(asset)}
                              title="Edit"
                              className="p-1 rounded-lg text-[#7F8983] hover:text-[#303B38] hover:bg-[#F8F5EE] transition cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteAsset(asset)}
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
                Showing <strong>{filteredAssets.length}</strong> of <strong>{customAssets.length}</strong> assets
              </span>
              <span>{branchFilter === 'ALL' ? 'Central Office + Branches 1 to 22' : formatBranchLabel(branchFilter)}</span>
            </div>
          </div>
        </div>
      ) : (
        /* Categories Schema Tab */
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customCategories.map((cat) => {
              const count = customAssets.filter((a) => a.categoryId === cat.id).length;
              return (
                <div
                  key={cat.id}
                  className="bg-[#FFFDF7] rounded-2xl border border-[#E9E5DA] p-4 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-[#303B38]" />
                        <h3 className="font-bold text-xs text-[#303B38]">{cat.name}</h3>
                      </div>
                      <button
                        onClick={() => handleDeleteCategory(cat)}
                        className="text-[#7F8983] hover:text-[#F4A58F] p-1"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {cat.description && (
                      <p className="text-[11px] text-[#7F8983] mb-3">{cat.description}</p>
                    )}

                    <div className="border-t border-[#E9E5DA] pt-2 mt-2">
                      <span className="text-[10px] uppercase font-bold text-[#7F8983] block mb-1">
                        Dynamic Field Schema ({cat.customFields.length})
                      </span>
                      <div className="space-y-1">
                        {cat.customFields.map((f) => (
                          <div
                            key={f.id}
                            className="text-[11px] text-[#303B38] flex items-center justify-between bg-[#F8F5EE] px-2 py-1 rounded-md"
                          >
                            <span>{f.name}</span>
                            <span className="text-[10px] text-[#7F8983] font-mono uppercase">
                              {f.type} {f.required && '• Req'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-2 border-t border-[#E9E5DA] flex items-center justify-between text-xs text-[#7F8983]">
                    <span>{count} assets registered</span>
                    <button
                      onClick={() => {
                        setCategoryFilter(cat.id);
                        setActiveTab('assets');
                      }}
                      className="font-bold text-[#303B38] hover:underline"
                    >
                      Filter Assets
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: Add/Edit Custom Asset */}
      {isAssetModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#303B38]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF7] w-full max-w-lg rounded-2xl border border-[#E9E5DA] shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[#E9E5DA] flex items-center justify-between bg-gradient-to-r from-[#D8EEE4]/50 to-[#FFFDF7]">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#303B38]" />
                <h2 className="text-sm font-bold text-[#303B38]">
                  {editingAsset ? 'Edit Custom Asset' : 'Add New Custom Asset'}
                </h2>
              </div>
              <button onClick={() => setIsAssetModalOpen(false)}>
                <X className="w-4 h-4 text-[#7F8983]" />
              </button>
            </div>

            <form onSubmit={handleSaveAsset} className="p-6 space-y-3.5 text-xs overflow-y-auto flex-1">
              {errorMessage && (
                <div className="p-2.5 rounded-xl bg-[#FDECE7] border border-[#F4A58F] text-[#F4A58F] font-semibold text-[11px]">
                  {errorMessage}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#303B38] mb-1">
                    Custom Category *
                  </label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] font-bold text-[#303B38]"
                  >
                    {customCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
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
                <label className="block text-[11px] font-bold text-[#303B38] mb-1">
                  Asset Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zebra DS2208 Handheld Barcode Scanner"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] text-[#303B38]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#303B38] mb-1">
                    Serial / Tag Number
                  </label>
                  <input
                    type="text"
                    placeholder="Manufacturer S/N"
                    value={formSerial}
                    onChange={(e) => setFormSerial(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] text-[#303B38] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#303B38] mb-1">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] font-bold text-[#303B38]"
                  >
                    <option value="Active">Active</option>
                    <option value="In Stock">In Stock</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Retired">Retired</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Category Custom Fields */}
              {activeCategory && activeCategory.customFields.length > 0 && (
                <div className="border border-[#BFDCCB] bg-[#D8EEE4]/30 rounded-xl p-3.5 space-y-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#303B38] block">
                    Dynamic Attributes for {activeCategory.name}
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    {activeCategory.customFields.map((field) => (
                      <div key={field.id}>
                        <label className="block text-[11px] font-semibold text-[#303B38] mb-1">
                          {field.name} {field.required && '*'}
                        </label>
                        <input
                          type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                          required={field.required}
                          value={formCustomValues[field.name] || ''}
                          onChange={(e) =>
                            setFormCustomValues({
                              ...formCustomValues,
                              [field.name]: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#FFFDF7] border border-[#E9E5DA] text-xs text-[#303B38]"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-[#303B38] mb-1">Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Location or additional technical notes..."
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] text-[#303B38]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E9E5DA]">
                <button
                  type="button"
                  onClick={() => setIsAssetModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#F8F5EE] text-[#7F8983] font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#A8DCCB] to-[#BFDCCB] text-[#303B38] font-bold shadow-xs cursor-pointer hover:opacity-95"
                >
                  {isSubmitting ? 'Saving...' : editingAsset ? 'Update Asset' : 'Save Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Create Category with Dynamic Field Builder */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#303B38]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF7] w-full max-w-lg rounded-2xl border border-[#E9E5DA] shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E9E5DA] mb-4">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-[#303B38]" />
                <h3 className="text-sm font-bold text-[#303B38]">
                  Define Custom Category & Fields
                </h3>
              </div>
              <button onClick={() => setIsCategoryModalOpen(false)}>
                <X className="w-4 h-4 text-[#7F8983]" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#303B38] mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CCTV Security NVRs / Cash Drawers"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] font-bold text-[#303B38]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#303B38] mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Purpose and branch deployment scope"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] text-[#303B38]"
                />
              </div>

              {/* Dynamic Field Builder List */}
              <div className="border-t border-[#E9E5DA] pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-[#303B38]">
                    Category Fields Definition
                  </span>
                  <button
                    type="button"
                    onClick={handleAddFieldToCat}
                    className="px-2.5 py-1 rounded-lg bg-[#D8EEE4] text-[#303B38] font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Field</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {newCatFields.map((f, idx) => (
                    <div key={f.id} className="flex items-center gap-2 bg-[#F8F5EE] p-2 rounded-xl border border-[#E9E5DA]">
                      <input
                        type="text"
                        placeholder="Field Name (e.g. Firmware)"
                        value={f.name}
                        onChange={(e) => {
                          const updated = [...newCatFields];
                          updated[idx].name = e.target.value;
                          setNewCatFields(updated);
                        }}
                        className="flex-1 px-2 py-1 rounded-lg bg-[#FFFDF7] border border-[#E9E5DA] text-xs"
                      />
                      <select
                        value={f.type}
                        onChange={(e) => {
                          const updated = [...newCatFields];
                          updated[idx].type = e.target.value as any;
                          setNewCatFields(updated);
                        }}
                        className="px-2 py-1 rounded-lg bg-[#FFFDF7] border border-[#E9E5DA] text-xs font-semibold"
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemoveFieldFromCat(idx)}
                        className="text-[#7F8983] hover:text-[#F4A58F] p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#E9E5DA] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#F8F5EE] text-[#7F8983] font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#A8DCCB] to-[#BFDCCB] text-[#303B38] font-bold shadow-xs cursor-pointer"
                >
                  Create Category Schema
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: View Details */}
      {viewingAsset && (
        <div className="fixed inset-0 z-50 bg-[#303B38]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF7] w-full max-w-md rounded-2xl border border-[#E9E5DA] shadow-xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E9E5DA] mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#303B38]" />
                <h3 className="text-sm font-bold text-[#303B38]">Custom Asset Profile</h3>
              </div>
              <button onClick={() => setViewingAsset(null)}>
                <X className="w-4 h-4 text-[#7F8983]" />
              </button>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-[#E9E5DA]/50">
                <span className="text-[#7F8983]">Asset:</span>
                <strong className="text-[#303B38]">{viewingAsset.name}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E9E5DA]/50">
                <span className="text-[#7F8983]">Category:</span>
                <span className="font-semibold text-[#303B38]">{viewingAsset.categoryName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E9E5DA]/50">
                <span className="text-[#7F8983]">Branch:</span>
                <strong className="text-[#303B38]">{formatBranchLabel(viewingAsset.branchNumber)}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E9E5DA]/50">
                <span className="text-[#7F8983]">Serial Number:</span>
                <span className="font-mono text-[#303B38]">{viewingAsset.serialNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E9E5DA]/50">
                <span className="text-[#7F8983]">Status:</span>
                <span className="font-bold text-[#303B38]">{viewingAsset.status}</span>
              </div>
              {viewingAsset.customFieldValues && Object.keys(viewingAsset.customFieldValues).length > 0 && (
                <div className="py-2 border-b border-[#E9E5DA]/50 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-[#7F8983] block">Attributes:</span>
                  {Object.entries(viewingAsset.customFieldValues).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-[11px]">
                      <span className="text-[#7F8983]">{k}:</span>
                      <strong className="text-[#303B38]">{String(v)}</strong>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-[#E9E5DA]/50">
                <span className="text-[#7F8983]">Remarks:</span>
                <span className="text-[#303B38]">{viewingAsset.remarks || 'None'}</span>
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-[#E9E5DA] flex justify-end">
              <button
                onClick={() => setViewingAsset(null)}
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
