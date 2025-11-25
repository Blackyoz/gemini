export type GroupStatus = '等待' | '成团' | '取消';

export type EntryType = 'travel' | 'business';

export interface TravelGroup {
  id: string;
  type: 'travel';
  groupNo: string;
  date: string;
  destination: string;
  personInCharge?: string;
  status: GroupStatus;
  recruitCount: number;
  revenue: number;
  expense: number;
  createdAt?: string;
  updatedAt?: string;
  creatorId?: string;
}

export interface BusinessProject {
  id: string;
  type: 'business';
  projectName: string;
  date: string;
  personInCharge?: string;
  revenue: number;
  expense: number;
  createdAt?: string;
  updatedAt?: string;
  creatorId?: string;
}

// Unified Data Item for the Table
export type DataItem = TravelGroup | BusinessProject;

export interface GenericFormData {
  id: string | null;
  type: EntryType;
  // Travel Specific
  groupNo: string;
  destination: string;
  status: GroupStatus;
  recruitCount: number;
  // Business Specific
  projectName: string;
  // Common
  date: string;
  personInCharge: string;
  revenue: number;
  expense: number;
}

export interface StatData {
  totalRevenue: number;
  totalExpense: number;
  totalProfit: number;
  totalPax: number; // Only for travel
  activeGroups: number; // Only for travel
  projectCount: number; // Only for business/total
}

export interface ChartDataPoint {
  name: string;
  revenue: number;
  profit: number;
}

export interface StatusDataPoint {
  name: string;
  value: number;
}