// src/components/types/fees.ts (or components/types/fees.ts)

// --- Interface Definitions for Populated Data (FIXED IDs) ---
export interface SchoolInfo {
    name?: string; address?: string; logo?: string;
    session?: string; phone?: string; email?: string;
}

// FIX: ID is number (Prisma Student ID)
export interface StudentInfo {
    id: number; 
    name: string; studentId?: string; // Custom ID (string)
    class?: string; rollNo?: string;
}

// FIX: ID is number
export interface TemplateInfo {
    id: number; 
    name: string;
    items: { name: string; amount: number }[];
    totalAmount: number;
}

// FIX: ID is number
export interface FeeRecordInfo {
    id: number; 
    discount?: number; lateFine?: number;
}
export interface CollectorInfo {
    name: string;
}

// --- Main Transaction Interface (FIXED ID) ---
export interface Transaction {
    id: number; // FIX: Transaction ID (Prisma ID) is now number
    receiptId: string;
    // Use the specific interfaces for populated fields
    studentId?: StudentInfo; 
    templateId?: TemplateInfo; 
    feeRecordId?: FeeRecordInfo | string; 
    collectedBy?: CollectorInfo; 
    schoolInfo?: SchoolInfo; 

    amountPaid: number;
    paymentMode: string;
    paymentDate: string; // ISO String or Date
    notes?: string;
    status: 'Success' | 'Pending' | 'Failed';

    // Conditional Payment Details
    transactionId?: string;
    chequeNumber?: string;
    bankName?: string;
    walletName?: string;
    gatewayMethod?: string;

    // Fallbacks (No Change)
    studentName?: string; 
    className?: string; 
    studentRegId?: string; 
    templateName?: string; 
    collectedByName?: string; 
    totalFeeAmount?: number; 
    discountGiven?: number; 
    lateFineApplied?: number; 
}

// --- Specific Type for Receipt Data (same as Transaction for now) ---
export interface ReceiptData extends Transaction {}

// --- Specific Type for Fee Record List Item (FIXED IDs) ---
export interface FeeRecordListItem {
  id: number; // FIX: Fee Record ID is number
  amount: number;
  amountPaid: number;
  balanceDue: number;
  dueDate: string;
  status: 'Pending' | 'Partial' | 'Paid' | 'Late';
  templateId: { id: number; name: string }; // FIX: Template ID is number
  studentId: number; // FIX: Student ID is number
  classId: string;
  // studentName?: string; 
  // className?: string;
}

// --- Specific Type for Student Search Results (ID remains string - Custom/Reg No) ---
export interface StudentSearchResult {
  id: string; // This is often the student's string registration ID, so we keep it string.
  name: string;
  class: string;
  studentId?: string; // Optional registration ID
}