import React, { useState, useMemo } from 'react';
import { ColumnMeta } from '../../types';
import { Search, ChevronLeft, ChevronRight, Hash, Calendar, Tag, FileText, ArrowUpDown } from 'lucide-react';

interface DatasetTableProps {
  data: Record<string, any>[];
  columns: ColumnMeta[];
  maxHeight?: string;
}

export const DatasetTable: React.FC<DatasetTableProps> = ({ data, columns, maxHeight = '460px' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter & Sort
  const filteredData = useMemo(() => {
    let result = [...data];

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(row =>
        Object.values(row).some(v => v !== null && v !== undefined && String(v).toLowerCase().includes(lower))
      );
    }

    if (sortCol) {
      result.sort((a, b) => {
        const valA = a[sortCol];
        const valB = b[sortCol];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDir === 'asc' ? valA - valB : valB - valA;
        }
        return sortDir === 'asc'
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    return result;
  }, [data, searchTerm, sortCol, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const handleSort = (colName: string) => {
    if (sortCol === colName) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(colName);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };

  const getColIcon = (type: string) => {
    switch (type) {
      case 'numeric':
        return <Hash className="h-3 w-3 text-cyan-400" />;
      case 'date':
        return <Calendar className="h-3 w-3 text-amber-400" />;
      case 'categorical':
        return <Tag className="h-3 w-3 text-teal-400" />;
      default:
        return <FileText className="h-3 w-3 text-slate-400" />;
    }
  };

  return (
    <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-3 bg-slate-900/80">
        <div className="relative min-w-[220px]">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search rows..."
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-slate-700 bg-slate-800/80 pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:border-teal-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={e => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200 focus:outline-none"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>
            Showing <strong className="text-slate-200">{filteredData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> - <strong className="text-slate-200">{Math.min(currentPage * pageSize, filteredData.length)}</strong> of <strong className="text-slate-200">{filteredData.length}</strong>
          </span>
        </div>
      </div>

      {/* Table Scroller */}
      <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight }}>
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/95 backdrop-blur text-[11px] uppercase tracking-wider text-slate-400">
            <tr>
              <th className="py-2.5 px-3 w-10 text-center font-mono">#</th>
              {columns.map(col => (
                <th
                  key={col.name}
                  onClick={() => handleSort(col.name)}
                  className="cursor-pointer py-2.5 px-3 font-semibold hover:bg-slate-800/50 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    {getColIcon(col.type)}
                    <span>{col.name}</span>
                    <ArrowUpDown className="h-3 w-3 opacity-40 hover:opacity-100" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="py-12 text-center text-slate-400">
                  No matching records found.
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2 px-3 text-center font-mono text-[11px] text-slate-400">
                    {(currentPage - 1) * pageSize + idx + 1}
                  </td>
                  {columns.map(col => {
                    const val = row[col.name];
                    const isMissing = val === null || val === undefined || val === '';
                    return (
                      <td key={col.name} className="py-2 px-3 whitespace-nowrap">
                        {isMissing ? (
                          <span className="italic text-slate-400">null</span>
                        ) : typeof val === 'number' ? (
                          <span className="font-mono text-slate-200">{val.toLocaleString()}</span>
                        ) : (
                          <span>{String(val)}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/80 px-4 py-2 text-xs">
        <span className="text-slate-400">
          Page {currentPage} of {totalPages}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded-lg border border-slate-700 p-1 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="rounded-lg border border-slate-700 p-1 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
