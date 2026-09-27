import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Dataset } from '../../types';
import { extractColumnMetadata, calculateQualityScore } from '../../services/sampleData';
import { UploadCloud, FileSpreadsheet, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface DatasetUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatasetUploadModal: React.FC<DatasetUploadModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { createDataset, notify } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [datasetName, setDatasetName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelectedFile = (selectedFile: File) => {
    setErrorMessage(null);
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
      setErrorMessage('Unsupported format. Please upload a .csv, .xlsx, or .xls file.');
      return;
    }
    // Limit to 25MB
    if (selectedFile.size > 25 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 25MB maximum limit.');
      return;
    }

    setFile(selectedFile);
    if (!datasetName) {
      setDatasetName(selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
    }
  };

  const processAndUpload = async () => {
    if (!file || !user) {
      setErrorMessage('Please select a file to upload.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      let parsedRows: Record<string, any>[] = [];
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (ext === 'csv') {
        parsedRows = await new Promise((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: (results: any) => {
              if (results.errors.length > 0 && results.data.length === 0) {
                reject(new Error(results.errors[0].message));
              } else {
                resolve(results.data as Record<string, any>[]);
              }
            },
            error: (err: any) => reject(err)
          });
        });
      } else {
        // Excel file
        const dataBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(dataBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        parsedRows = XLSX.utils.sheet_to_json(worksheet, { defval: null });
      }

      if (!parsedRows || parsedRows.length === 0) {
        throw new Error('The file contains no readable data rows or empty headers.');
      }

      // Column metadata & Quality Score
      const columns = extractColumnMetadata(parsedRows);
      const qualityScore = calculateQualityScore(parsedRows, columns);

      const newDataset: Dataset = {
        id: crypto.randomUUID(),
        userId: user.id,
        name: datasetName.trim() || file.name,
        description: description.trim() || undefined,
        fileName: file.name,
        fileSize: file.size,
        rowCount: parsedRows.length,
        columnCount: columns.length,
        columns,
        dataQualityScore: qualityScore,
        rawPreviewData: parsedRows.slice(0, 100),
        data: parsedRows,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await createDataset(newDataset);
      onClose();
    } catch (err: any) {
      console.error('File parsing error:', err);
      setErrorMessage(err.message || 'Failed to parse file. Please verify file integrity.');
      notify('error', 'Upload Failed', err.message || 'Error parsing dataset file.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">Upload Dataset</h2>
              <p className="text-xs text-slate-400">Import CSV or Excel (.xlsx) files into your secure analytics workspace</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {/* Drag & Drop Area */}
          <div
            onDragOver={e => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all ${
              isDragging
                ? 'border-teal-400 bg-teal-500/10'
                : file
                ? 'border-teal-500/50 bg-slate-800/40'
                : 'border-slate-700 bg-slate-800/20 hover:border-slate-600 hover:bg-slate-800/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={e => {
                if (e.target.files && e.target.files.length > 0) {
                  handleSelectedFile(e.target.files[0]);
                }
              }}
            />
            {file ? (
              <div className="flex flex-col items-center">
                <CheckCircle className="h-9 w-9 text-teal-400 mb-2" />
                <span className="text-sm font-medium text-slate-200">{file.name}</span>
                <span className="text-xs text-slate-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB • Ready for schema audit</span>
                <span className="mt-2 text-xs text-teal-400 underline hover:text-teal-300">Choose different file</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <UploadCloud className="h-10 w-10 text-slate-400 mb-2" />
                <span className="text-sm font-medium text-slate-200">Drag and drop file here, or click to browse</span>
                <span className="text-xs text-slate-400 mt-1">Supports CSV, XLSX, XLS up to 25MB</span>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">Dataset Name</label>
            <input
              type="text"
              placeholder="e.g. Q3 Sales & Churn Analytics"
              value={datasetName}
              onChange={e => setDatasetName(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">Description (Optional)</label>
            <textarea
              rows={2}
              placeholder="Context regarding source system, currency, or reporting timeframe..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none resize-none"
            />
          </div>

          {errorMessage && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-800/50 bg-rose-950/30 p-2.5 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-lg border border-slate-700 px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={processAndUpload}
            disabled={!file || isProcessing}
            className="flex items-center gap-1.5 rounded-lg bg-teal-500 px-4 py-1.5 text-xs font-medium text-slate-950 hover:bg-teal-400 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Auditing & Indexing...</span>
              </>
            ) : (
              <span>Process & Save Dataset</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
