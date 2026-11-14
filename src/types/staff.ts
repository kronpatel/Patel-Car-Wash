import type {
  Staff,
  Attendance,
  Salary,
  Advance,
  AttendanceQR,
  StaffStatus,
  AttendanceStatus,
  AttendanceMethod,
  PaymentMode,
  AdvanceStatus,
} from "@prisma/client";

// Re-export Prisma types
export type {
  Staff,
  Attendance,
  Salary,
  Advance,
  AttendanceQR,
  StaffStatus,
  AttendanceStatus,
  AttendanceMethod,
  PaymentMode,
  AdvanceStatus,
};

// DTOs for API input
export interface CreateStaffInput {
  name: string;
  email: string;
  mobile: string;
  address?: string;
  joiningDate: string; // ISO date string
  role: string;
  photo?: string;
  baseSalary: number;
}

export interface UpdateStaffInput extends Partial<CreateStaffInput> {
  status?: StaffStatus;
}

export interface StaffWithStats extends Staff {
  presentDaysThisMonth?: number;
  absentDaysThisMonth?: number;
  totalPendingAdvance?: number;
  thisMonthSalary?: number;
}

export interface MarkAttendanceInput {
  staffId: string;
  status: AttendanceStatus;
  method: AttendanceMethod;
  latitude?: number;
  longitude?: number;
  remark?: string;
}

export interface SalaryCalculationInput {
  staffId: string;
  month: number; // 1-12
  year: number;
  baseSalary: number;
  presentDays: number;
  absentDays: number;
  advanceCut?: number;
  deduction?: number;
  bonus?: number;
  isManual?: boolean;
}

export interface GenerateQRInput {
  expiresInDays: number; // e.g. 1, 7, 30, 90, 365
}

export interface StaffLoginInput {
  identifier: string; // email OR mobile number
  password: string;
  token?: string; // QR token
  latitude?: number;
  longitude?: number;
}
