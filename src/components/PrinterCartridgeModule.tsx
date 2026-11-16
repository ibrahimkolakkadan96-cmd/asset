import React, { useState, useMemo } from 'react';
import { useTracker } from '../context/TrackerContext';
import {
  PrinterModel,
  CartridgeModel,
  CartridgeBranchStock,
  CartridgeTransaction,
  ALL_LOCATIONS,
  formatBranchLabel,
} from '../types';
import {
  Printer,
  Package,
  Plus,
  Search,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  ShieldAlert,
  Edit2,
  Trash2,
  History,
  Building2,
  X,
  Save,
  CheckCircle2,
  Settings2,
} from 'lucide-react';

export const PrinterCartridgeModule: React.FC = () => {
  const {
    printerModels,
    cartridgeModels,
    cartridgeStock,
    cartridgeTransactions,
    selectedBranch,
    setSelectedBranch,
    addPrinterModel,
    updatePrinterModel,
    deletePrinterModel,
    addCartridgeModel,
    updateCartridgeModel,
    deleteCartridgeModel,
    cartridgeStockIn,
    cartridgeStockOut,
    updateCartridgeMinStock,
  } = useTracker();

  const [activeSubTab, setActiveSubTab] = useState<'stock' | 'printers' | 'cartridges' | 'history'>('stock');
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState<number | 'ALL'>(selectedBranch ?? 'ALL');

  // Modals
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [isStockOutModalOpen, setIsStockOutModalOpen] = useState(false);
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<PrinterModel | null>(null);
  const [isCartridgeModalOpen, setIsCartridgeModalOpen] = useState(false);
  const [editingCartridge, setEditingCartridge] = useState<CartridgeModel | null>(null);

  // Stock In / Out form state
  const [selectedStockRow, setSelectedStockRow] = useState<CartridgeBranchStock | null>(null);
  const [txQty, setTxQty] = useState<number>(1);
  const [txPerformedBy, setTxPerformedBy] = useState('');
  const [txRemarks, setTxRemarks] = useState('');
  const [txInvoice, setTxInvoice] = useState('');
  const [txError, setTxError] = useState<string | null>(null);

  // Printer form state
  const [formPrinterBrand, setFormPrinterBrand] = useState('HP');
  const [formPrinterName, setFormPrinterName] = useState('');
  const [formPrinterComp, setFormPrinterComp] = useState('');
  const [formPrinterRemarks, setFormPrinterRemarks] = useState('');

  // Cartridge form state
  const [formCartModel, setFormCartModel] = useState('');
  const [formCartPrinter, setFormCartPrinter] = useState('');
  const [formCartMin, setFormCartMin] = useState(2);
  const [formCartMax, setFormCartMax] = useState(20);
  const [formCartLoc, setFormCartLoc] = useState('');
  const [formCartRemarks, setFormCartRemarks] = useState('');

  // Filtered Stock list
  const filteredStock = useMemo(() => {
    return cartridgeStock.filter((s) => {
      if (branchFilter !== 'ALL' && s.branchNumber !== branchFilter) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const match =
          s.cartridgeModel.toLowerCase().includes(q) ||
          s.storageLocation.toLowerCase().includes(q) ||
          `branch ${s.branchNumber}`.includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [cartridgeStock, branchFilter, searchQuery]);

  // Handle Stock IN
  const handleOpenStockIn = (row?: CartridgeBranchStock) => {
    setSelectedStockRow(row || cartridgeStock[0] || null);
    setTxQty(1);
    setTxPerformedBy('Authorized Staff');
    setTxRemarks('');
    setTxInvoice('');
    setTxError(null);
    setIsStockInModalOpen(true);
  };

  const handleConfirmStockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStockRow || txQty <= 0) return;
    await cartridgeStockIn({
      cartridgeId: selectedStockRow.cartridgeId,
      branchNumber: selectedStockRow.branchNumber,
      quantity: txQty,
      performedBy: txPerformedBy.trim(),
      remarks: txRemarks.trim(),
      referenceInvoiceNo: txInvoice.trim() || undefined,
    });
    setIsStockInModalOpen(false);
  };

  // Handle Stock OUT
  const handleOpenStockOut = (row?: CartridgeBranchStock) => {
    setSelectedStockRow(row || cartridgeStock[0] || null);
    setTxQty(1);
    setTxPerformedBy('Authorized Staff');
    setTxRemarks('');
    setTxError(null);
    setIsStockOutModalOpen(true);
  };

  const handleConfirmStockOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStockRow || txQty <= 0) return;
    setTxError(null);
    const res = await cartridgeStockOut({
      cartridgeId: selectedStockRow.cartridgeId,
      branchNumber: selectedStockRow.branchNumber,
      quantity: txQty,
      performedBy: txPerformedBy.trim(),
      remarks: txRemarks.trim(),
    });
    if (!res.success) {
      setTxError(res.error || 'Failed to issue stock.');
    } else {
      setIsStockOutModalOpen(false);
    }
  };

  // Printer Save
  const handleSavePrinter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPrinterName.trim()) return;
    if (editingPrinter) {
      await updatePrinterModel(editingPrinter.id, {
        brand: formPrinterBrand,
        modelName: formPrinterName.trim(),
        cartridgeCompatibility: formPrinterComp.split(',').map((s) => s.trim()).filter(Boolean),
        remarks: formPrinterRemarks.trim(),
      });
    } else {
      await addPrinterModel({
        brand: formPrinterBrand,
        modelName: formPrinterName.trim(),
        cartridgeCompatibility: formPrinterComp.split(',').map((s) => s.trim()).filter(Boolean),
        remarks: formPrinterRemarks.trim(),
      });
    }
    setIsPrinterModalOpen(false);
  };

  // Cartridge Save
  const handleSaveCartridge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCartModel.trim()) return;
    if (editingCartridge) {
      await updateCartridgeModel(editingCartridge.id, {
        cartridgeModel: formCartModel.trim(),
        printerModel: formCartPrinter.trim(),
        minimumStockLevel: formCartMin,
        maximumStockLevel: formCartMax,
        storageLocation: formCartLoc.trim(),
        remarks: formCartRemarks.trim(),
      });
    } else {
      await addCartridgeModel({
        cartridgeModel: formCartModel.trim(),
        printerModel: formCartPrinter.trim(),
        minimumStockLevel: formCartMin,
        maximumStockLevel: formCartMax,
        storageLocation: formCartLoc.trim(),
        remarks: formCartRemarks.trim(),
      });
    }
    setIsCartridgeModalOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8F5EE] text-[#303B38] overflow-hidden">
      {/* Top Header & Sub-Nav */}
      <div className="p-4 bg-[#FFFDF7] border-b border-[#E9E5DA] flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 mr-2">
            <div className="p-2 rounded-xl bg-[#A8DCCB] text-[#303B38] shadow-xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#303B38]">Printer Cartridge Management</h2>
              <p className="text-[11px] text-[#7F8983]">
                Branch-wise Cartridge Inventory • Minimum Stock Alert (Default 2) • Stock IN/OUT
              </p>
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="flex items-center bg-[#F8F5EE] p-1 rounded-xl border border-[#E9E5DA] text-xs font-bold">
            <button
              onClick={() => setActiveSubTab('stock')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeSubTab === 'stock'
                  ? 'bg-[#FFFDF7] text-[#303B38] shadow-xs'
                  : 'text-[#7F8983] hover:text-[#303B38]'
              }`}
            >
              Current Stock (Branch 1-22)
            </button>
            <button
              onClick={() => setActiveSubTab('printers')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeSubTab === 'printers'
                  ? 'bg-[#FFFDF7] text-[#303B38] shadow-xs'
                  : 'text-[#7F8983] hover:text-[#303B38]'
              }`}
            >
              Printer Models ({printerModels.length})
            </button>
            <button
              onClick={() => setActiveSubTab('cartridges')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeSubTab === 'cartridges'
                  ? 'bg-[#FFFDF7] text-[#303B38] shadow-xs'
                  : 'text-[#7F8983] hover:text-[#303B38]'
              }`}
            >
              Cartridge Models ({cartridgeModels.length})
            </button>
            <button
              onClick={() => setActiveSubTab('history')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeSubTab === 'history'
                  ? 'bg-[#FFFDF7] text-[#303B38] shadow-xs'
                  : 'text-[#7F8983] hover:text-[#303B38]'
              }`}
            >
              Stock History ({cartridgeTransactions.length})
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenStockIn()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#A8DCCB] to-[#BFDCCB] text-[#303B38] font-bold text-xs shadow-xs hover:opacity-95 cursor-pointer border border-[#91c9b6]"
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>Stock IN</span>
          </button>
          <button
            onClick={() => handleOpenStockOut()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#F4A58F] to-[#e89078] text-white font-bold text-xs shadow-xs hover:opacity-95 cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Stock OUT</span>
          </button>
        </div>
      </div>

      {/* SUBTAB 1: Current Stock */}
      {activeSubTab === 'stock' && (
        <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FFFDF7] p-3 rounded-2xl border border-[#E9E5DA] shadow-2xs text-xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7F8983]" />
                <input
                  type="text"
                  placeholder="Search cartridge model, location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#FFFDF7] border border-[#E9E5DA] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#303B38] placeholder-[#7F8983] focus:outline-none focus:border-[#A8DCCB]"
                />
              </div>

              {/* Branch Filter */}
              <div className="flex items-center gap-1.5 bg-[#F8F5EE] border border-[#E9E5DA] rounded-xl px-3 py-1.5 text-xs text-[#303B38]">
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

            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-[#FDECE7] text-[#303B38] font-bold text-[10px] border border-[#F4A58F]">
                ≤ 2 Pcs: Low Stock Alert
              </span>
              <span className="px-2 py-0.5 rounded bg-[#F4A58F] text-white font-bold text-[10px]">
                0 Pcs: Out of Stock Alert
              </span>
            </div>
          </div>

          {/* Stock Table */}
          <div className="flex-1 overflow-auto bg-[#FFFDF7] border border-[#E9E5DA] rounded-2xl shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8F5EE] text-[#7F8983] font-bold uppercase text-[11px] border-b border-[#E9E5DA]">
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Cartridge Model</th>
                  <th className="py-3 px-4 text-center">Current Stock</th>
                  <th className="py-3 px-4 text-center">Min Level</th>
                  <th className="py-3 px-4 text-center">Max Level</th>
                  <th className="py-3 px-4">Storage Location</th>
                  <th className="py-3 px-4">Stock Status Alert</th>
                  <th className="py-3 px-4">Remarks</th>
                  <th className="py-3 px-4 text-center">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E5DA]">
                {filteredStock.map((row) => {
                  const isZero = row.currentStock <= 0;
                  const isLow = row.currentStock > 0 && row.currentStock <= row.minimumStockLevel;

                  return (
                    <tr
                      key={row.id}
                      className={`hover:bg-[#F8F5EE]/60 transition ${
                        isZero ? 'bg-[#FDECE7]/40' : isLow ? 'bg-[#FFFDF7]' : ''
                      }`}
                    >
                      <td className="py-2.5 px-4 font-bold text-[#303B38]">
                        <span className="px-2 py-0.5 rounded-md bg-[#D8EEE4] text-[#303B38] border border-[#A8DCCB] text-[11px]">
                          {formatBranchLabel(row.branchNumber)}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-bold text-[#303B38]">
                        {row.cartridgeModel}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full font-black text-sm font-mono inline-block ${
                            isZero
                              ? 'bg-[#F4A58F] text-white animate-pulse'
                              : isLow
                              ? 'bg-[#FDECE7] text-[#303B38] border border-[#F4A58F]'
                              : 'bg-[#D8EEE4] text-[#303B38]'
                          }`}
                        >
                          {row.currentStock} pcs
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-[#7F8983]">
                        {row.minimumStockLevel}
                      </td>
                      <td className="py-2.5 px-4 text-center text-[#7F8983]">
                        {row.maximumStockLevel}
                      </td>
                      <td className="py-2.5 px-4 text-[#303B38]">
                        {row.storageLocation}
                      </td>
                      <td className="py-2.5 px-4">
                        {isZero ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#F4A58F] text-white flex items-center gap-1 w-max">
                            <ShieldAlert className="w-3 h-3" /> OUT OF STOCK
                          </span>
                        ) : isLow ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#FDECE7] text-[#303B38] border border-[#F4A58F] flex items-center gap-1 w-max">
                            <AlertTriangle className="w-3 h-3 text-[#F4A58F]" /> LOW STOCK ALERT
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D8EEE4] text-[#303B38] w-max">
                            Sufficient
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-[#7F8983] max-w-[200px] truncate" title={row.remarks}>
                        {row.remarks || '—'}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenStockIn(row)}
                            title="Add Stock IN"
                            className="px-2 py-1 rounded-lg bg-[#D8EEE4] hover:bg-[#A8DCCB] text-[#303B38] font-bold text-[10px] transition cursor-pointer"
                          >
                            + IN
                          </button>
                          <button
                            onClick={() => handleOpenStockOut(row)}
                            title="Issue Stock OUT"
                            className="px-2 py-1 rounded-lg bg-[#FDECE7] hover:bg-[#F4A58F] hover:text-white text-[#303B38] font-bold text-[10px] transition cursor-pointer border border-[#F4A58F]/40"
                          >
                            - OUT
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
      )}

      {/* SUBTAB 2: Printer Models */}
      {activeSubTab === 'printers' && (
        <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-4">
          <div className="flex items-center justify-between bg-[#FFFDF7] p-3.5 rounded-2xl border border-[#E9E5DA] shadow-2xs">
            <div>
              <h3 className="text-xs font-bold text-[#303B38]">Registered Printer Hardware Models</h3>
              <p className="text-[11px] text-[#7F8983]">Add printer models and define compatible cartridge series</p>
            </div>
            <button
              onClick={() => {
                setEditingPrinter(null);
                setFormPrinterBrand('HP');
                setFormPrinterName('');
                setFormPrinterComp('HP 76A');
                setFormPrinterRemarks('');
                setIsPrinterModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#A8DCCB] to-[#BFDCCB] text-[#303B38] font-bold text-xs shadow-xs hover:opacity-95 cursor-pointer border border-[#91c9b6]"
            >
              <Plus className="w-4 h-4 text-[#303B38]" />
              <span>Add Printer Model</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto">
            {printerModels.map((prn) => (
              <div key={prn.id} className="bg-[#FFFDF7] border border-[#E9E5DA] rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#D8EEE4] text-[#303B38] flex items-center justify-center font-bold text-xs">
                      {prn.brand[0]}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#7F8983] uppercase tracking-wider">{prn.brand}</span>
                      <h4 className="text-xs font-bold text-[#303B38]">{prn.modelName}</h4>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingPrinter(prn);
                        setFormPrinterBrand(prn.brand);
                        setFormPrinterName(prn.modelName);
                        setFormPrinterComp(prn.cartridgeCompatibility ? prn.cartridgeCompatibility.join(', ') : '');
                        setFormPrinterRemarks(prn.remarks || '');
                        setIsPrinterModalOpen(true);
                      }}
                      className="p-1 rounded-lg hover:bg-[#F8F5EE] text-[#7F8983] hover:text-[#303B38] cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={async () => {
                        if (window.confirm(`Delete printer model "${prn.modelName}"?`)) {
                          const res = await deletePrinterModel(prn.id);
                          if (!res.success) alert(res.error);
                        }
                      }}
                      className="p-1 rounded-lg hover:bg-[#FDECE7] text-[#7F8983] hover:text-[#F4A58F] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-2.5 bg-[#F8F5EE] rounded-xl text-xs space-y-1">
                  <span className="text-[10px] font-bold text-[#7F8983] uppercase block">Compatible Cartridges:</span>
                  <div className="flex flex-wrap gap-1">
                    {(prn.cartridgeCompatibility || []).map((c, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-[#FFFDF7] border border-[#E9E5DA] text-[10px] font-bold text-[#303B38]">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-[#7F8983]">{prn.remarks || 'Standard office deployment'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 3: Cartridge Models */}
      {activeSubTab === 'cartridges' && (
        <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-4">
          <div className="flex items-center justify-between bg-[#FFFDF7] p-3.5 rounded-2xl border border-[#E9E5DA] shadow-2xs">
            <div>
              <h3 className="text-xs font-bold text-[#303B38]">Registered Cartridge Master Models</h3>
              <p className="text-[11px] text-[#7F8983]">Manage cartridge catalog, default alert minimums and maximum stock capacity</p>
            </div>
            <button
              onClick={() => {
                setEditingCartridge(null);
                setFormCartModel('');
                setFormCartPrinter(printerModels[0]?.modelName || 'HP LaserJet Pro M404dn');
                setFormCartMin(2);
                setFormCartMax(20);
                setFormCartLoc('Central IT Store');
                setFormCartRemarks('');
                setIsCartridgeModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#A8DCCB] to-[#BFDCCB] text-[#303B38] font-bold text-xs shadow-xs hover:opacity-95 cursor-pointer border border-[#91c9b6]"
            >
              <Plus className="w-4 h-4 text-[#303B38]" />
              <span>Add Cartridge Model</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto">
            {cartridgeModels.map((cart) => {
              const totalStock = cartridgeStock
                .filter((s) => s.cartridgeId === cart.id)
                .reduce((sum, s) => sum + s.currentStock, 0);

              return (
                <div key={cart.id} className="bg-[#FFFDF7] border border-[#E9E5DA] rounded-2xl p-4 shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[#303B38]">{cart.cartridgeModel}</h4>
                      <p className="text-[11px] text-[#7F8983]">{cart.printerModel}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingCartridge(cart);
                          setFormCartModel(cart.cartridgeModel);
                          setFormCartPrinter(cart.printerModel || cart.printerModelName || '');
                          setFormCartMin(cart.minimumStockLevel ?? 2);
                          setFormCartMax(cart.maximumStockLevel ?? 20);
                          setFormCartLoc(cart.storageLocation || '');
                          setFormCartRemarks(cart.remarks || '');
                          setIsCartridgeModalOpen(true);
                        }}
                        className="p-1 rounded-lg hover:bg-[#F8F5EE] text-[#7F8983] hover:text-[#303B38] cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm(`Delete cartridge model "${cart.cartridgeModel}"?`)) {
                            const res = await deleteCartridgeModel(cart.id);
                            if (!res.success) alert(res.error);
                          }
                        }}
                        className="p-1 rounded-lg hover:bg-[#FDECE7] text-[#7F8983] hover:text-[#F4A58F] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 bg-[#F8F5EE] rounded-xl border border-[#E9E5DA]">
                      <span className="text-[10px] text-[#7F8983] block">Total Stock</span>
                      <strong className="text-sm font-bold text-[#303B38] font-mono">{totalStock}</strong>
                    </div>
                    <div className="p-2 bg-[#F8F5EE] rounded-xl border border-[#E9E5DA]">
                      <span className="text-[10px] text-[#7F8983] block">Min Alert</span>
                      <strong className="text-sm font-bold text-[#303B38] font-mono">{cart.minimumStockLevel}</strong>
                    </div>
                    <div className="p-2 bg-[#F8F5EE] rounded-xl border border-[#E9E5DA]">
                      <span className="text-[10px] text-[#7F8983] block">Max Cap</span>
                      <strong className="text-sm font-bold text-[#303B38] font-mono">{cart.maximumStockLevel}</strong>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#7F8983]">
                    <strong>Location:</strong> {cart.storageLocation}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 4: Transaction History */}
      {activeSubTab === 'history' && (
        <div className="flex-1 overflow-auto p-4">
          <div className="bg-[#FFFDF7] border border-[#E9E5DA] rounded-2xl shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8F5EE] text-[#7F8983] font-bold uppercase text-[11px] border-b border-[#E9E5DA]">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Cartridge Model</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4 text-center">Quantity</th>
                  <th className="py-3 px-4">Performed By</th>
                  <th className="py-3 px-4">Invoice / Reference</th>
                  <th className="py-3 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E5DA]">
                {cartridgeTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#F8F5EE]/60 transition">
                    <td className="py-2.5 px-4 font-mono text-[#303B38]">{tx.transactionDate}</td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          tx.type === 'IN'
                            ? 'bg-[#D8EEE4] text-[#303B38]'
                            : 'bg-[#FDECE7] text-[#F4A58F] border border-[#F4A58F]'
                        }`}
                      >
                        {tx.type === 'IN' ? '+ Stock IN' : '- Stock OUT'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-bold text-[#303B38]">{tx.cartridgeModel}</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-[#F8F5EE] border border-[#E9E5DA] text-[11px] font-bold text-[#303B38]">
                        {formatBranchLabel(tx.branchNumber)}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center font-bold text-sm font-mono text-[#303B38]">
                      {tx.quantity} pcs
                    </td>
                    <td className="py-2.5 px-4 text-[#303B38]">{tx.performedBy}</td>
                    <td className="py-2.5 px-4 font-mono text-[#7F8983]">{tx.referenceInvoiceNo || '—'}</td>
                    <td className="py-2.5 px-4 text-[#7F8983]">{tx.remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Stock IN */}
      {isStockInModalOpen && selectedStockRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#FFFDF7] border border-[#E9E5DA] rounded-3xl shadow-2xl w-full max-w-md text-[#303B38] overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-[#D8EEE4] border-b border-[#A8DCCB] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowDownRight className="w-5 h-5 text-[#303B38]" />
                <h3 className="font-bold text-sm text-[#303B38]">Stock IN (Receive Cartridge)</h3>
              </div>
              <button onClick={() => setIsStockInModalOpen(false)} className="text-[#7F8983] hover:text-[#303B38] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmStockIn} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-[#F8F5EE] rounded-xl border border-[#E9E5DA] space-y-1">
                <div>Model: <strong className="text-[#303B38]">{selectedStockRow.cartridgeModel}</strong></div>
                <div>Branch: <strong className="text-[#303B38]">{formatBranchLabel(selectedStockRow.branchNumber)}</strong></div>
                <div>Current Stock: <span className="font-bold text-[#303B38]">{selectedStockRow.currentStock} pcs</span></div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#303B38]">Quantity to Add (Pieces) *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={txQty}
                  onChange={(e) => setTxQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full bg-[#FFFDF7] border border-[#E9E5DA] rounded-xl px-3 py-2 text-sm font-bold text-[#303B38] focus:outline-none focus:border-[#A8DCCB]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#303B38]">Received / Verified By *</label>
                <input
                  type="text"
                  required
                  value={txPerformedBy}
                  onChange={(e) => setTxPerformedBy(e.target.value)}
                  className="w-full bg-[#FFFDF7] border border-[#E9E5DA] rounded-xl px-3 py-2 text-xs text-[#303B38] focus:outline-none focus:border-[#A8DCCB]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#303B38]">Invoice / PO Number</label>
                <input
                  type="text"
                  placeholder="e.g. INV-2026-991"
                  value={txInvoice}
                  onChange={(e) => setTxInvoice(e.target.value)}
                  className="w-full bg-[#FFFDF7] border border-[#E9E5DA] rounded-xl px-3 py-2 text-xs font-mono text-[#303B38] focus:outline-none focus:border-[#A8DCCB]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#303B38]">Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Central depot bulk replenishment"
                  value={txRemarks}
                  onChange={(e) => setTxRemarks(e.target.value)}
                  className="w-full bg-[#FFFDF7] border border-[#E9E5DA] rounded-xl px-3 py-2 text-xs text-[#303B38] focus:outline-none focus:border-[#A8DCCB]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsStockInModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#FFFDF7] border border-[#E9E5DA] hover:bg-[#E9E5DA]/40 text-[#7F8983] font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#A8DCCB] to-[#BFDCCB] text-[#303B38] font-bold shadow-xs hover:opacity-95 cursor-pointer"
                >
                  Confirm Stock IN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Stock OUT */}
      {isStockOutModalOpen && selectedStockRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#FFFDF7] border border-[#E9E5DA] rounded-3xl shadow-2xl w-full max-w-md text-[#303B38] overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-[#FDECE7] border-b border-[#F4A58F] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-[#F4A58F]" />
                <h3 className="font-bold text-sm text-[#303B38]">Stock OUT (Issue Cartridge)</h3>
              </div>
              <button onClick={() => setIsStockOutModalOpen(false)} className="text-[#7F8983] hover:text-[#303B38] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmStockOut} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-[#F8F5EE] rounded-xl border border-[#E9E5DA] space-y-1">
                <div>Model: <strong className="text-[#303B38]">{selectedStockRow.cartridgeModel}</strong></div>
                <div>Branch: <strong className="text-[#303B38]">{formatBranchLabel(selectedStockRow.branchNumber)}</strong></div>
                <div>Available to Issue: <span className="font-bold text-[#303B38] text-sm font-mono">{selectedStockRow.currentStock} pcs</span></div>
              </div>

              {txError && (
                <div className="p-3 bg-[#FDECE7] border border-[#F4A58F] rounded-xl text-[#303B38] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#F4A58F] shrink-0" />
                  <span>{txError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-[#303B38]">Quantity to Issue (Pieces) *</label>
                <input
                  type="number"
                  min={1}
                  max={selectedStockRow.currentStock}
                  required
                  value={txQty}
                  onChange={(e) => setTxQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full bg-[#FFFDF7] border border-[#E9E5DA] rounded-xl px-3 py-2 text-sm font-bold text-[#303B38] focus:outline-none focus:border-[#A8DCCB]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#303B38]">Issued To (Staff / Department / Printer) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Counter 1 Invoice Printer (Ahmed)"
                  value={txPerformedBy}
                  onChange={(e) => setTxPerformedBy(e.target.value)}
                  className="w-full bg-[#FFFDF7] border border-[#E9E5DA] rounded-xl px-3 py-2 text-xs text-[#303B38] focus:outline-none focus:border-[#A8DCCB]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#303B38]">Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Replaced empty toner"
                  value={txRemarks}
                  onChange={(e) => setTxRemarks(e.target.value)}
                  className="w-full bg-[#FFFDF7] border border-[#E9E5DA] rounded-xl px-3 py-2 text-xs text-[#303B38] focus:outline-none focus:border-[#A8DCCB]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsStockOutModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#FFFDF7] border border-[#E9E5DA] hover:bg-[#E9E5DA]/40 text-[#7F8983] font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={selectedStockRow.currentStock <= 0}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#F4A58F] to-[#e89078] text-white font-bold shadow-xs hover:opacity-95 cursor-pointer disabled:opacity-50"
                >
                  Confirm Stock OUT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add / Edit Printer Model */}
      {isPrinterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#FFFDF7] border border-[#E9E5DA] rounded-3xl shadow-2xl w-full max-w-md text-[#303B38] overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-[#F8F5EE] border-b border-[#E9E5DA] flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#303B38]">
                {editingPrinter ? 'Edit Printer Model' : 'Add New Printer Model'}
              </h3>
              <button onClick={() => setIsPrinterModalOpen(false)} className="text-[#7F8983] hover:text-[#303B38] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSavePrinter} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#303B38]">Brand *</label>
                <select
                  value={formPrinterBrand}
                  onChange={(e) => setFormPrinterBrand(e.target.value)}
                  className="w-full bg-[#FFFDF7] border border-[#E9E5DA] rounded-xl px-3 py-2 text-xs font-bold text-[#303B38]"
                >
                  <option value="HP">HP</option>
                  <option value="Canon">Canon</option>
                  <option value="Brother">Brother</option>
                  <option value="Epson">Epson</option>
                  <option value="Xerox">Xerox</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-bold text-[#303B38]">Printer Model Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HP LaserJet Pro M404dn"
                  value={formPrinterName}
                  onChange={(e) => setFormPrinterName(e.target.value)}
                  className="w-full bg-[#FFFDF7] border border-[#E9E5DA] rounded-xl px-3 py-2 text-xs text-[#303B38]"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-[#303B38]">Compatible Cartridge Models (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. HP 76A (CF276A), HP 76X High Yield"
                  value={formPrinterComp}
                  onChange={(e) => setFormPrinterComp(e.target.value)}
                  className="w-full bg-[#FFFDF7] border border-[#E9E5DA] rounded-xl px-3 py-2 text-xs text-[#303B38]"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-[#303B38]">Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Installed in all 22 branch billing counters"
                  value={formPrinterRemarks}
                  onChange={(e) => setFormPrinterRemarks(e.target.value)}
                  className="w-full bg-[#FFFDF7] border border-[#E9E5DA] rounded-xl px-3 py-2 text-xs text-[#303B38]"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsPrinterModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#FFFDF7] border border-[#E9E5DA] hover:bg-[#E9E5DA]/40 text-[#7F8983] font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#A8DCCB] to-[#BFDCCB] text-[#303B38] font-bold"
                >
                  Save Printer Model
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add / Edit Cartridge Model */}
      {isCartridgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#FFFDF7] border border-[#E9E5DA] rounded-3xl shadow-2xl w-full max-w-md text-[#303B38] overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-[#F8F5EE] border-b border-[#E9E5DA] flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#303B38]">
                {editingCartridge ? 'Edit Cartridge Model' : 'Add New Cartridge Model'}
              </h3>
              <button onClick={() => setIsCartridgeModalOpen(false)} className="text-[#7F8983] hover:text-[#303B38] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveCartridge} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#303B38]">Cartridge Model *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HP 76A (CF276A)"
                  value={formCartModel}
                  onChange={(e) => setFormCartModel(e.target.value)}
                  className="w-full bg-[#FFFDF7] border border-[#E9E5DA] rounded-xl px-3 py-2 text-xs text-[#303B38]"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-[#303B38]">Compatible Printer Model *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HP LaserJet Pro M404dn"
                  value={formCartPrinter}
                  onChange={(e) => setFormCartPrinter(e.target.value)}
                  className="w-full bg-[#FFFDF7] border border-[#E9E5DA] rounded-xl px-3 py-2 text-xs text-[#303B38]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#303B38]">Min Stock Level (Alert) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formCartMin}
                    onChange={(e) => setFormCartMin(parseInt(e.target.value, 10) || 2)}
                    className="w-full bg-[#FFFDF7] border border-[#E9E5DA] rounded-xl px-3 py-2 text-xs font-bold text-[#303B38]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[#303B38]">Max Stock Level *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formCartMax}
                    onChange={(e) => setFormCartMax(parseInt(e.target.value, 10) || 20)}
                    className="w-full bg-[#FFFDF7] border border-[#E9E5DA] rounded-xl px-3 py-2 text-xs font-bold text-[#303B38]"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="font-bold text-[#303B38]">Storage Location</label>
                <input
                  type="text"
                  placeholder="e.g. Central IT Store Room Shelf A-1"
                  value={formCartLoc}
                  onChange={(e) => setFormCartLoc(e.target.value)}
                  className="w-full bg-[#FFFDF7] border border-[#E9E5DA] rounded-xl px-3 py-2 text-xs text-[#303B38]"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-[#303B38]">Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. 3,000 page standard toner"
                  value={formCartRemarks}
                  onChange={(e) => setFormCartRemarks(e.target.value)}
                  className="w-full bg-[#FFFDF7] border border-[#E9E5DA] rounded-xl px-3 py-2 text-xs text-[#303B38]"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCartridgeModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#FFFDF7] border border-[#E9E5DA] hover:bg-[#E9E5DA]/40 text-[#7F8983] font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#A8DCCB] to-[#BFDCCB] text-[#303B38] font-bold"
                >
                  Save Cartridge Model
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
