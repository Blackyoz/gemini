import React from 'react';
import { GroupStatus } from '../types';

interface StatusBadgeProps {
  status: GroupStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const styles = {
    '成团': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    '等待': 'bg-amber-100 text-amber-800 border-amber-200',
    '取消': 'bg-rose-100 text-rose-800 border-rose-200'
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
};

export default StatusBadge;