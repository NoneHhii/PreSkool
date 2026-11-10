import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit2,
  Trash2
} from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  title?: string;
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onView?: (row: T) => void;
  customActions?: (row: T) => React.ReactNode;
  enableSelection?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  title,
  data,
  columns,
  keyExtractor,
  isLoading = false,
  emptyMessage = 'No data available',
  onEdit,
  onDelete,
  onView,
  customActions,
  enableSelection = true,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeMenuId) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-datatable-menu]')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuId]);

  // Filter based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter((row) =>
      Object.values(row).some((val) =>
        val !== null && val !== undefined && String(val).toLowerCase().includes(term)
      )
    );
  }, [data, searchTerm]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = useMemo(
    () => filteredData.slice(startIndex, startIndex + rowsPerPage),
    [filteredData, startIndex, rowsPerPage]
  );

  // Toggle selection
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(paginatedData.map(keyExtractor)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-xs overflow-hidden">
      {/* Top Header */}
      {title && (
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer">
              <Filter className="h-3.5 w-3.5 text-gray-400" />
              <span>Filter</span>
            </button>
            <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer">
              <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
              <span>Sort By A-Z</span>
            </button>
          </div>
        </div>
      )}

      {/* Control bar: Rows per page & Search */}
      <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span>Row Per Page</span>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="rounded-lg border border-gray-200 bg-gray-50/50 px-2.5 py-1.5 text-xs font-medium text-gray-700 outline-none focus:border-blue-500"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span>Entries</span>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search..."
            className="w-full rounded-lg border border-gray-200 bg-gray-50/50 py-1.5 pl-8 pr-3 text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-gray-600">
          <thead className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
            <tr>
              {enableSelection && (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={
                      paginatedData.length > 0 &&
                      paginatedData.every((row) => selectedIds.has(keyExtractor(row)))
                    }
                    onChange={handleSelectAll}
                    className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th key={col.key} className={`px-4 py-3 ${col.className || ''}`}>
                  <div className="flex items-center gap-1.5">
                    <span>{col.header}</span>
                    {col.sortable && <ArrowUpDown className="h-3 w-3 text-gray-400" />}
                  </div>
                </th>
              ))}
              {(onEdit || onDelete || onView || customActions) && (
                <th className="w-16 px-4 py-3 text-right">Action</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-normal">
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length + (enableSelection ? 1 : 0) + 1}
                  className="px-4 py-12 text-center text-gray-400"
                >
                  <div className="inline-flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    <span>Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (enableSelection ? 1 : 0) + 1}
                  className="px-4 py-12 text-center text-gray-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => {
                const rowId = keyExtractor(row);
                const isSelected = selectedIds.has(rowId);
                const isMenuOpen = activeMenuId === rowId;

                return (
                  <tr
                    key={rowId}
                    className={`transition hover:bg-gray-50/80 ${
                      isSelected ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    {enableSelection && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(rowId)}
                          className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                    )}

                    {columns.map((col) => (
                      <td key={col.key} className={`px-4 py-3 text-gray-700 ${col.className || ''}`}>
                        {col.render ? col.render(row, index) : row[col.key]}
                      </td>
                    ))}

                    {(onEdit || onDelete || onView || customActions) && (
                      <td className="relative px-4 py-3 text-right">
                        <div className="inline-block text-left" data-datatable-menu="true">
                          <button
                            onClick={() => setActiveMenuId(isMenuOpen ? null : rowId)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition cursor-pointer"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {isMenuOpen && (
                            <div className="absolute right-4 z-20 mt-1 w-32 rounded-lg border border-gray-100 bg-white py-1 shadow-lg ring-1 ring-black/5 animate-in fade-in">
                              {onView && (
                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onView(row);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer"
                                >
                                  <Eye className="h-3.5 w-3.5 text-gray-500" />
                                  <span>View</span>
                                </button>
                              )}
                              {onEdit && (
                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onEdit(row);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer"
                                >
                                  <Edit2 className="h-3.5 w-3.5 text-blue-500" />
                                  <span>Edit</span>
                                </button>
                              )}
                              {customActions && customActions(row)}
                              {onDelete && (
                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onDelete(row);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>Delete</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col gap-3 border-t border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500">
        <div>
          Showing {filteredData.length === 0 ? 0 : startIndex + 1} to{' '}
          {Math.min(startIndex + rowsPerPage, filteredData.length)} of {filteredData.length} entries
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex h-8 items-center gap-1 rounded-lg border border-gray-200 px-2.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Pre</span>
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
            .map((page, idx, arr) => {
              const prev = arr[idx - 1];
              return (
                <React.Fragment key={page}>
                  {prev && page - prev > 1 && <span className="px-1 text-gray-400">...</span>}
                  <button
                    onClick={() => setCurrentPage(page)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition cursor-pointer ${
                      currentPage === page
                        ? 'bg-[#3d5ee1] text-white shadow-xs'
                        : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                </React.Fragment>
              );
            })}

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="flex h-8 items-center gap-1 rounded-lg border border-gray-200 px-2.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default DataTable;
