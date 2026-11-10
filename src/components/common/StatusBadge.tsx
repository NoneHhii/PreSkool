import React from 'react';

interface StatusBadgeProps {
  status: 'Active' | 'Inactive' | 'Pending' | 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'LATE' | string;
  label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const normStatus = status?.toUpperCase();

  let colorClasses = 'bg-gray-50 text-gray-700 ring-gray-600/20';
  let dotColor = 'bg-gray-400';
  let displayLabel = label || status;

  if (normStatus === 'ACTIVE' || normStatus === 'PRESENT') {
    colorClasses = 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
    dotColor = 'bg-emerald-500';
    if (!label && normStatus === 'ACTIVE') displayLabel = 'Active';
  } else if (normStatus === 'INACTIVE' || normStatus === 'ABSENT') {
    colorClasses = 'bg-rose-50 text-rose-700 ring-rose-600/20';
    dotColor = 'bg-rose-500';
    if (!label && normStatus === 'INACTIVE') displayLabel = 'Inactive';
  } else if (normStatus === 'PENDING' || normStatus === 'LATE') {
    colorClasses = 'bg-amber-50 text-amber-700 ring-amber-600/20';
    dotColor = 'bg-amber-500';
  } else if (normStatus === 'EXCUSED') {
    colorClasses = 'bg-blue-50 text-blue-700 ring-blue-600/20';
    dotColor = 'bg-blue-500';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${colorClasses}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      <span>{displayLabel}</span>
    </span>
  );
};

export default StatusBadge;
