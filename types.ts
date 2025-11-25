export type GroupStatus = '等待' | '成团' | '取消';

export interface TravelGroup {
  id: string;
  groupNo: string;
  date: string;
  destination: string;
  status: GroupStatus;
  recruitCount: number;
  revenue: number;
  expense: number;
  createdAt?: string;
  updatedAt?: string;
  creatorId?: string;
}

export interface TravelGroupFormData {
  id: string | null;
  groupNo: string;
  date: string;
  destination: string;
  status: GroupStatus;
  recruitCount: number;
  revenue: number;
  expense: number;
}

export interface StatData {
  totalRevenue: number;
  totalExpense: number;
  totalProfit: number;
  totalPax: number;
  activeGroups: number;
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