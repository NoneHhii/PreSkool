import React from 'react';
import { RotateCw, Printer, Download, Plus } from 'lucide-react';
import Button from './Button';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  breadcrumbs: BreadcrumbItem[];
  actionLabel?: string;
  onActionClick?: () => void;
  onRefresh?: () => void;
  onPrint?: () => void;
  onExport?: () => void;
  extraActions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  breadcrumbs,
  actionLabel,
  onActionClick,
  onRefresh,
  onPrint,
  onExport,
  extraActions,
}) => {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Title & Breadcrumbs */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h1>
        <nav className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-gray-300">/</span>}
              <span className={idx === breadcrumbs.length - 1 ? 'text-gray-600 font-medium' : 'hover:text-gray-600 transition'}>
                {crumb.label}
              </span>
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Toolbar actions */}
      <div className="flex flex-wrap items-center gap-2">
        {onRefresh && (
          <button
            onClick={onRefresh}
            title="Refresh data"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition shadow-xs cursor-pointer"
          >
            <RotateCw className="h-4 w-4" />
          </button>
        )}

        {onPrint && (
          <button
            onClick={onPrint}
            title="Print"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition shadow-xs cursor-pointer"
          >
            <Printer className="h-4 w-4" />
          </button>
        )}

        {onExport && (
          <button
            onClick={onExport}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition shadow-xs cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-gray-500" />
            <span>Export</span>
          </button>
        )}

        {extraActions}

        {actionLabel && onActionClick && (
          <Button
            onClick={onActionClick}
            leftIcon={<Plus className="h-4 w-4" />}
            size="md"
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
