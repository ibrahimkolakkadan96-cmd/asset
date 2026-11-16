import React, { useState } from 'react';
import { useTracker } from '../context/TrackerContext';
import { parseExcelFile } from '../lib/excelExport';
import { SystemAsset, AccessoryStock, StockTransaction } from '../types';
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({ isOpen, onClose }) => {
  const { importFromExcel } = useTracker();

  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parsedResult, setParsedResult] = useState<{
    systems: SystemAsset[];
    accessories: AccessoryStock[];
    transactions: StockTransaction[];
  } | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrorMsg(null);
    setIsParsing(true);

    try {
      const result = await parseExcelFile(selectedFile);
      setParsedResult(result);
    } catch (err: any) {
      console.error('Failed to parse excel file', err);
      setErrorMsg(err?.message || 'Failed to parse Excel workbook. Please verify valid .xlsx file.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!parsedResult) return;
    await importFromExcel(
      parsedResult.systems,
      parsedResult.accessories,
      parsedResult.transactions
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-[#FFFDF7] rounded-2xl shadow-2xl border border-[#E9E5DA] w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#F8F5EE] border-b border-[#E9E5DA] text-[#303B38] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#A8DCCB] text-[#303B38] shadow-xs">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#303B38]">Import Excel Tracker (.xlsx)</h3>
              <p className="text-xs text-[#7F8983]">
                Load System Details, Accessories, or Transactions from spreadsheet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#7F8983] hover:text-[#303B38] hover:bg-[#E9E5DA]/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Dropzone */}
          <label className="border-2 border-dashed border-[#E9E5DA] hover:border-[#A8DCCB] rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-[#F8F5EE] hover:bg-[#D8EEE4]/30 transition group">
            <FileSpreadsheet className="w-10 h-10 text-[#7F8983] group-hover:text-[#303B38] mb-2 transition" />
            <span className="font-bold text-[#303B38] text-sm">
              {file ? file.name : 'Select or drag & drop an Excel file (.xlsx)'}
            </span>
            <span className="text-[#7F8983] text-xs mt-1">
              Supports standard multi-tab tracker workbooks or single sheets
            </span>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {isParsing && (
            <div className="text-center py-4 text-[#7F8983]">
              <span className="animate-pulse">Reading worksheets and formulas...</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-[#FDECE7] border border-[#F4A58F] rounded-xl text-[#303B38] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#F4A58F] shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {parsedResult && (
            <div className="bg-[#F8F5EE] border border-[#E9E5DA] rounded-xl p-4 space-y-2">
              <span className="font-bold text-[#303B38] uppercase tracking-wider text-[11px] block">
                Worksheet Parse Preview:
              </span>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-[#FFFDF7] p-2.5 rounded-lg border border-[#E9E5DA]">
                  <div className="text-lg font-black text-[#303B38]">
                    {parsedResult.systems.length}
                  </div>
                  <div className="text-[10px] text-[#7F8983] uppercase font-semibold">
                    Systems Found
                  </div>
                </div>
                <div className="bg-[#FFFDF7] p-2.5 rounded-lg border border-[#E9E5DA]">
                  <div className="text-lg font-black text-[#303B38]">
                    {parsedResult.accessories.length}
                  </div>
                  <div className="text-[10px] text-[#7F8983] uppercase font-semibold">
                    Accessories Found
                  </div>
                </div>
                <div className="bg-[#FFFDF7] p-2.5 rounded-lg border border-[#E9E5DA]">
                  <div className="text-lg font-black text-[#303B38]">
                    {parsedResult.transactions.length}
                  </div>
                  <div className="text-[10px] text-[#7F8983] uppercase font-semibold">
                    Transactions
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 border-t border-[#E9E5DA] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#E9E5DA] hover:bg-[#E9E5DA]/40 rounded-lg font-semibold text-[#7F8983] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!parsedResult}
              onClick={handleConfirmImport}
              className="px-5 py-2 bg-gradient-to-r from-[#A8DCCB] to-[#BFDCCB] hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed text-[#303B38] font-bold rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply & Load Tracker Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
