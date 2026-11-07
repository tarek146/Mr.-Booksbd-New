import React, { useState, useId } from 'react';
import {
  X,
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Package,
  Table,
  Sparkles,
  HelpCircle,
  Check
} from 'lucide-react';
import { Product, ProductType } from '../types';
import {
  parseCsv,
  guessColumnMapping,
  transformRowToProduct,
  generateSampleCsv,
  BOOK_SCHEMA_FIELDS,
  STATIONERY_SCHEMA_FIELDS,
  ParsedProductItem
} from '../utils/csvProductImport';

interface BulkProductImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportProducts: (products: Omit<Product, 'id' | 'createdAt'>[]) => Promise<void>;
  categories: { id: string; name: string; type: ProductType }[];
}

export const BulkProductImportModal: React.FC<BulkProductImportModalProps> = ({
  isOpen,
  onClose,
  onImportProducts,
  categories
}) => {
  const [selectedType, setSelectedType] = useState<ProductType>('book');
  const [step, setStep] = useState<'upload' | 'mapping' | 'importing' | 'completed'>('upload');
  const [fileName, setFileName] = useState('');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({}); // { schemaKey: csvHeader }
  const [parsedItems, setParsedItems] = useState<ParsedProductItem[]>([]);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, percent: 0 });
  const [importResults, setImportResults] = useState<{ successCount: number; failCount: number }>({ successCount: 0, failCount: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showErrorRowsOnly, setShowErrorRowsOnly] = useState(false);
  const fileInputId = useId();

  if (!isOpen) return null;

  const currentSchemaFields = selectedType === 'book' ? BOOK_SCHEMA_FIELDS : STATIONERY_SCHEMA_FIELDS;

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const { headers, rows } = parseCsv(text);
      if (headers.length === 0 || rows.length === 0) {
        alert('সিএসভি ফাইলে কোনো বৈধ হেডার বা ডাটা পাওয়া যায়নি। অনুগ্রহ করে সঠিক CSV ফাইল আপলোড করুন।');
        return;
      }

      setCsvHeaders(headers);
      setCsvRows(rows);

      // Auto guess column mapping
      const guessed = guessColumnMapping(headers, selectedType);
      setColumnMapping(guessed);

      // Compute parsed rows with this mapping
      recalculateParsedItems(rows, headers, guessed, selectedType);
      setStep('mapping');
    };
    reader.readAsText(file);
  };

  // Recalculate parsed items based on current column mapping
  const recalculateParsedItems = (
    rows: string[][],
    headers: string[],
    mapping: Record<string, string>,
    type: ProductType
  ) => {
    const items: ParsedProductItem[] = [];

    rows.forEach((row, rowIdx) => {
      // Build a rowMap: { [schemaKey]: cellValue }
      const rowMap: Record<string, string> = {};

      Object.entries(mapping).forEach(([schemaKey, csvHeader]) => {
        const headerIdx = headers.indexOf(csvHeader);
        if (headerIdx !== -1 && row[headerIdx] !== undefined) {
          rowMap[schemaKey] = row[headerIdx];
        }
      });

      const parsed = transformRowToProduct(rowMap, type, rowIdx + 1);
      items.push(parsed);
    });

    setParsedItems(items);
  };

  const handleMappingChange = (schemaKey: string, csvHeader: string) => {
    const updated = { ...columnMapping };
    if (!csvHeader) {
      delete updated[schemaKey];
    } else {
      updated[schemaKey] = csvHeader;
    }
    setColumnMapping(updated);
    recalculateParsedItems(csvRows, csvHeaders, updated, selectedType);
  };

  const handleDownloadSample = (type: ProductType) => {
    const csvContent = generateSampleCsv(type);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `mr_books_${type}_bulk_import_sample.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleStartImport = async () => {
    const validPayloads = parsedItems.filter(item => item.isValid).map(item => item.productPayload);
    if (validPayloads.length === 0) {
      alert('ইমপোর্ট করার মতো কোনো বৈধ প্রোডাক্ট পাওয়া যায়নি। অনুগ্রহ করে হেডার ম্যাপিং চেক করুন।');
      return;
    }

    setStep('importing');
    setIsProcessing(true);
    setImportProgress({ current: 0, total: validPayloads.length, percent: 0 });

    try {
      await onImportProducts(validPayloads);
      setImportResults({
        successCount: validPayloads.length,
        failCount: parsedItems.length - validPayloads.length
      });
      setStep('completed');
    } catch (err: any) {
      console.error('Bulk import error:', err);
      alert('ইমপোর্ট করতে সমস্যা হয়েছে: ' + (err.message || 'Unknown error'));
      setStep('mapping');
    } finally {
      setIsProcessing(false);
    }
  };

  const validCount = parsedItems.filter(i => i.isValid).length;
  const errorCount = parsedItems.length - validCount;
  const filteredPreviewItems = showErrorRowsOnly
    ? parsedItems.filter(i => !i.isValid)
    : parsedItems;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-neutral-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#D71920] border border-red-200/60 flex items-center justify-center shrink-0">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-neutral-900">
                  Bulk Import Products (CSV Upload)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Firebase Sync
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                সিএসভি ফাইল আপলোড করে এক ক্লিকে শত শত বই বা স্টেশনারি ডাটাবেসে যুক্ত করুন
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 cursor-pointer disabled:opacity-40 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="px-6 py-3 bg-[#F7F7F8] border-b border-neutral-200/80 flex items-center justify-between text-xs font-bold text-neutral-600 shrink-0">
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              step === 'upload' ? 'bg-[#D71920] text-white' : 'bg-emerald-600 text-white'
            }`}>
              {step !== 'upload' ? '✓' : '1'}
            </span>
            <span className={step === 'upload' ? 'text-neutral-900 font-extrabold' : ''}>
              1. Upload CSV
            </span>
          </div>
          <span className="text-neutral-300">→</span>
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              step === 'mapping' ? 'bg-[#D71920] text-white' : (step === 'importing' || step === 'completed') ? 'bg-emerald-600 text-white' : 'bg-neutral-200 text-neutral-500'
            }`}>
              {(step === 'importing' || step === 'completed') ? '✓' : '2'}
            </span>
            <span className={step === 'mapping' ? 'text-neutral-900 font-extrabold' : ''}>
              2. Map Headers & Preview
            </span>
          </div>
          <span className="text-neutral-300">→</span>
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              step === 'importing' ? 'bg-[#D71920] text-white animate-pulse' : step === 'completed' ? 'bg-emerald-600 text-white' : 'bg-neutral-200 text-neutral-500'
            }`}>
              {step === 'completed' ? '✓' : '3'}
            </span>
            <span className={step === 'completed' || step === 'importing' ? 'text-neutral-900 font-extrabold' : ''}>
              3. Done
            </span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* STEP 1: UPLOAD CSV & CHOOSE TYPE */}
          {step === 'upload' && (
            <div className="space-y-6">
              
              {/* Select Catalog Type */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                  ১. প্রোডাক্ট ক্যাটালগ টাইপ সিলেক্ট করুন
                </label>
                <div className="grid grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    onClick={() => setSelectedType('book')}
                    className={`p-4 rounded-2xl border-2 flex items-center gap-3.5 text-left transition-all cursor-pointer ${
                      selectedType === 'book'
                        ? 'border-[#D71920] bg-red-50/30 shadow-xs'
                        : 'border-neutral-200 hover:border-neutral-300 bg-white'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedType === 'book' ? 'bg-red-100 text-[#D71920]' : 'bg-neutral-100 text-neutral-500'
                    }`}>
                      <BookOpen size={20} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs sm:text-sm text-neutral-900">📚 Book Catalog (বই)</h4>
                      <p className="text-[11px] text-neutral-500 mt-0.5">লেখক, প্রকাশনী, পৃষ্ঠা, আইএসবিএন সহ বইয়ের তালিকা</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedType('stationery')}
                    className={`p-4 rounded-2xl border-2 flex items-center gap-3.5 text-left transition-all cursor-pointer ${
                      selectedType === 'stationery'
                        ? 'border-blue-500 bg-blue-50/30 shadow-xs'
                        : 'border-neutral-200 hover:border-neutral-300 bg-white'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedType === 'stationery' ? 'bg-blue-100 text-blue-600' : 'bg-neutral-100 text-neutral-500'
                    }`}>
                      <Package size={20} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs sm:text-sm text-neutral-900">✏️ Stationery Catalog (স্টেশনারি)</h4>
                      <p className="text-[11px] text-neutral-500 mt-0.5">ব্র্যান্ড, উপাদান, সাইজ ও কালার সহ স্টেশনারি পণ্য</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Sample Templates Download Box */}
              <div className="p-4 rounded-2xl bg-[#F7F7F8] border border-[#E5E5E5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-neutral-800">
                      স্যাম্পল সিএসভি টেমপ্লেট ডাউনলোড করুন
                    </h5>
                    <p className="text-[11px] text-neutral-500">
                      সঠিক ফরম্যাট অনুযায়ী ফাইল সাজাতে স্যাম্পল টেমপ্লেটটি ব্যবহার করতে পারেন
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDownloadSample('book')}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                  >
                    <Download size={13} className="text-[#D71920]" />
                    <span>Book Template</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadSample('stationery')}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                  >
                    <Download size={13} className="text-blue-600" />
                    <span>Stationery Template</span>
                  </button>
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                  ২. সিএসভি ফাইল সিলেক্ট বা ড্রপ করুন
                </label>
                <label
                  htmlFor={fileInputId}
                  className="border-2 border-dashed border-neutral-300 hover:border-[#D71920] hover:bg-[#FFF9F9] bg-[#FDFDFD] rounded-3xl p-8 sm:p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all group shadow-2xs"
                >
                  <div className="w-14 h-14 rounded-2xl bg-red-50 text-[#D71920] border border-red-200/60 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Upload size={26} />
                  </div>
                  <h4 className="font-extrabold text-sm text-neutral-800 group-hover:text-[#D71920] transition-colors">
                    Click to select or drag and drop your CSV file
                  </h4>
                  <p className="text-xs text-neutral-500 mt-1">
                    Supports .csv file format (UTF-8 encoding with English or Bangla text)
                  </p>
                  <div className="mt-4 px-4 py-1.5 rounded-full bg-neutral-100 text-neutral-600 text-[11px] font-bold">
                    Maximum 500 products per upload
                  </div>
                  <input
                    id={fileInputId}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

            </div>
          )}

          {/* STEP 2: COLUMN MAPPING & PREVIEW */}
          {step === 'mapping' && (
            <div className="space-y-6">

              {/* File Info Bar */}
              <div className="p-4 rounded-2xl bg-[#F7F7F8] border border-[#E5E5E5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white border border-neutral-200 flex items-center justify-center text-neutral-700 font-black">
                    <FileSpreadsheet size={18} className="text-[#D71920]" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-neutral-900">{fileName}</h5>
                    <div className="flex items-center gap-2 text-neutral-500 mt-0.5 text-[11px]">
                      <span>{csvRows.length} rows found</span>
                      <span>•</span>
                      <span>{csvHeaders.length} columns detected</span>
                      <span>•</span>
                      <span className="font-bold text-[#D71920] uppercase">{selectedType} catalog</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('upload');
                      setFileName('');
                      setCsvHeaders([]);
                      setCsvRows([]);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 font-bold text-xs cursor-pointer shadow-2xs"
                  >
                    Change File
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const reGuessed = guessColumnMapping(csvHeaders, selectedType);
                      setColumnMapping(reGuessed);
                      recalculateParsedItems(csvRows, csvHeaders, reGuessed, selectedType);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs cursor-pointer shadow-xs flex items-center gap-1"
                  >
                    <Sparkles size={12} />
                    <span>Auto Map</span>
                  </button>
                </div>
              </div>

              {/* Header Mapping Grid */}
              <div className="bg-white border border-[#E5E5E5] rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <Table size={16} className="text-[#D71920]" />
                    <h4 className="font-extrabold text-sm text-neutral-900">
                      Header Mapping (সিএসভি কলামের সাথে ফিল্ডের মিলবন্ধন)
                    </h4>
                  </div>
                  <span className="text-[11px] text-neutral-500">
                    * চিহ্নিত ফিল্ডগুলো আবশ্যক
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {currentSchemaFields.map((field) => {
                    const currentMapped = columnMapping[field.key] || '';
                    const isMapped = Boolean(currentMapped);

                    return (
                      <div
                        key={field.key}
                        className={`p-3 rounded-xl border transition-all ${
                          field.required && !isMapped
                            ? 'border-red-300 bg-red-50/20'
                            : isMapped
                            ? 'border-neutral-200 bg-[#FDFDFD]'
                            : 'border-dashed border-neutral-200 bg-[#F7F7F8]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[11px] font-bold text-neutral-700 truncate">
                            {field.label} {field.required && <span className="text-[#D71920]">*</span>}
                          </label>
                          <span className="text-[10px] text-neutral-400 font-medium">
                            {field.labelBn}
                          </span>
                        </div>

                        <select
                          value={currentMapped}
                          onChange={(e) => handleMappingChange(field.key, e.target.value)}
                          className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-bold focus:outline-none transition-colors ${
                            isMapped
                              ? 'border-emerald-300 bg-white text-emerald-900 font-black'
                              : field.required
                              ? 'border-red-300 bg-white text-red-600'
                              : 'border-neutral-200 bg-white text-neutral-500'
                          }`}
                        >
                          <option value="">-- Ignore / Unmapped --</option>
                          {csvHeaders.map((header) => (
                            <option key={header} value={header}>
                              CSV Column: &quot;{header}&quot;
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Data Validation & Preview Table */}
              <div className="bg-white border border-[#E5E5E5] rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
                  <div>
                    <h4 className="font-extrabold text-sm text-neutral-900">
                      Live Data Preview & Validation ({parsedItems.length} Products)
                    </h4>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      ইমপোর্ট করার পূর্বে প্রথম সারিগুলোর তথ্য যাচাই করে নিন
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 size={13} />
                      <span>{validCount} Valid</span>
                    </span>

                    {errorCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowErrorRowsOnly(!showErrorRowsOnly)}
                        className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200 flex items-center gap-1 cursor-pointer hover:bg-red-100 transition-colors"
                      >
                        <AlertCircle size={13} />
                        <span>{errorCount} With Issues {showErrorRowsOnly ? '(Showing)' : '(Filter)'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Preview Table */}
                <div className="border border-neutral-200 rounded-xl overflow-x-auto max-h-[300px]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#F7F7F8] border-b border-neutral-200 text-neutral-600 font-bold uppercase text-[10px]">
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Title / Name</th>
                        <th className="py-2.5 px-3">Price</th>
                        <th className="py-2.5 px-3">Regular</th>
                        <th className="py-2.5 px-3">{selectedType === 'book' ? 'Author' : 'Brand'}</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">SKU</th>
                        <th className="py-2.5 px-3">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 font-medium">
                      {filteredPreviewItems.slice(0, 10).map((item) => (
                        <tr
                          key={item.rowNumber}
                          className={item.isValid ? 'hover:bg-neutral-50/60' : 'bg-red-50/30 hover:bg-red-50/50'}
                        >
                          <td className="py-2 px-3 text-neutral-400 font-mono text-[11px]">{item.rowNumber}</td>
                          <td className="py-2 px-3">
                            {item.isValid ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <Check size={10} /> Ready
                              </span>
                            ) : (
                              <span
                                title={item.errors.join(', ')}
                                className="inline-flex items-center gap-1 text-red-600 font-bold text-[10px] bg-red-100 px-2 py-0.5 rounded-full border border-red-200 cursor-help"
                              >
                                <AlertCircle size={10} /> Error
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-bold text-neutral-900 max-w-[200px] truncate">
                            {item.productPayload.title || <span className="text-red-500 font-normal italic">Missing Title</span>}
                          </td>
                          <td className="py-2 px-3 font-black text-emerald-700">
                            ৳{item.productPayload.price || 0}
                          </td>
                          <td className="py-2 px-3 text-neutral-400">
                            {item.productPayload.previousPrice ? `৳${item.productPayload.previousPrice}` : '-'}
                          </td>
                          <td className="py-2 px-3 text-neutral-700 max-w-[120px] truncate">
                            {(selectedType === 'book' ? item.productPayload.author : item.productPayload.brand) || '-'}
                          </td>
                          <td className="py-2 px-3 text-neutral-600">
                            <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-[10px]">
                              {item.productPayload.category}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono text-neutral-500 text-[11px]">
                            {item.productPayload.sku}
                          </td>
                          <td className="py-2 px-3 text-neutral-700 font-bold">
                            {item.productPayload.stock}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {parsedItems.length > 10 && (
                  <p className="text-[11px] text-neutral-400 text-center">
                    Showing first 10 of {parsedItems.length} products. All {validCount} valid products will be imported into Firebase.
                  </p>
                )}
              </div>

            </div>
          )}

          {/* STEP 3: IMPORTING PROGRESS */}
          {step === 'importing' && (
            <div className="py-12 px-4 text-center space-y-5">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-red-50 text-[#D71920] border border-red-200 flex items-center justify-center animate-bounce">
                <FileSpreadsheet size={32} />
              </div>
              <div>
                <h4 className="font-black text-lg text-neutral-900">
                  Firebase ডাটাবেসে প্রোডাক্ট যুক্ত করা হচ্ছে...
                </h4>
                <p className="text-xs text-neutral-500 mt-1">
                  অনুগ্রহ করে অপেক্ষা করুন, উইন্ডো বন্ধ করবেন না
                </p>
              </div>

              <div className="max-w-md mx-auto space-y-2">
                <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200">
                  <div
                    className="h-full bg-[#D71920] transition-all duration-300 rounded-full"
                    style={{ width: `${importProgress.percent || 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-neutral-500 font-bold">
                  <span>Syncing with Firestore...</span>
                  <span>{validCount} Products</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: COMPLETED SUMMARY */}
          {step === 'completed' && (
            <div className="py-10 px-4 text-center space-y-5">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h4 className="font-black text-xl text-neutral-900">
                  বাল্ক ইমপোর্ট সফলভাবে সম্পন্ন হয়েছে!
                </h4>
                <p className="text-xs text-neutral-500 mt-1.5">
                  সবগুলো প্রোডাক্ট ফায়ারবেস ডাটাবেসে সেভ হয়ে গেছে এবং ইনভেন্টরি টেবিলে যোগ হয়েছে।
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto pt-2">
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-center">
                  <span className="block text-2xl font-black text-emerald-700">
                    {importResults.successCount}
                  </span>
                  <span className="text-xs font-bold text-emerald-800">
                    ইমপোর্ট সম্পন্ন
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-center">
                  <span className="block text-2xl font-black text-neutral-500">
                    {importResults.failCount}
                  </span>
                  <span className="text-xs font-bold text-neutral-600">
                    স্কিপ বা ত্রুটিপূর্ণ
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-neutral-200 bg-[#F7F7F8] flex items-center justify-between shrink-0">
          {step === 'upload' && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 font-bold text-xs cursor-pointer shadow-2xs"
              >
                বাতিল করুন (Cancel)
              </button>
              <div className="text-xs text-neutral-400 font-medium">
                ফাইল নির্বাচন করলে স্বয়ংক্রিয়ভাবে পরবর্তী ধাপে নিয়ে যাবে
              </div>
            </>
          )}

          {step === 'mapping' && (
            <>
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 font-bold text-xs cursor-pointer shadow-2xs"
              >
                ← Back
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-neutral-200/80 hover:bg-neutral-300 text-neutral-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={validCount === 0 || isProcessing}
                  onClick={handleStartImport}
                  className="px-6 py-2.5 bg-[#D71920] hover:bg-[#B9151B] disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2 transition-all hover:scale-[1.02]"
                >
                  <span>Confirm & Import ({validCount} Products)</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </>
          )}

          {step === 'completed' && (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-[#D71920] hover:bg-[#B9151B] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2 transition-all hover:scale-[1.02]"
              >
                <Check size={14} />
                <span>ইনভেন্টরিতে যান (View in Inventory)</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
