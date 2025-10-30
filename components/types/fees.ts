// src/types/fees.ts (or components/types/fees.ts)

// --- Interface Definitions for Populated Data ---
export interface SchoolInfo {
    name?: string; address?: string; logo?: string;
    session?: string; phone?: string; email?: string;
}
export interface StudentInfo {
    id: string; name: string; studentId?: string; // Custom ID
    class?: string; rollNo?: string;
}
export interface TemplateInfo {
    id: string; name: string;
    items: { name: string; amount: number }[];
    totalAmount: number;
}
export interface FeeRecordInfo {
    id: string; discount?: number; lateFine?: number;
}
export interface CollectorInfo {
    name: string;
}

// --- Main Transaction Interface (Expecting Populated Fields) ---
export interface Transaction {
    id: string;
    receiptId: string;
    // Use the specific interfaces for populated fields
    studentId?: StudentInfo; // Expect populated object
    templateId?: TemplateInfo; // Expect populated object
    feeRecordId?: FeeRecordInfo | string; // Allow string ID or populated object
    collectedBy?: CollectorInfo; // Expect populated object
    schoolInfo?: SchoolInfo; // Expect populated object

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

    // Keep fallbacks ONLY if backend might NOT populate everything
    studentName?: string; // Fallback name
    className?: string; // Fallback class
    studentRegId?: string; // Fallback custom ID
    templateName?: string; // Fallback template name
    collectedByName?: string; // Fallback collector name
    totalFeeAmount?: number; // Fallback total
    discountGiven?: number; // Fallback discount
    lateFineApplied?: number; // Fallback late fine
}

// --- Specific Type for Receipt Data (same as Transaction for now) ---
export interface ReceiptData extends Transaction {}

// --- Specific Type for Fee Record List Item ---
export interface FeeRecordListItem {
  id: string;
  amount: number;
  amountPaid: number;
  balanceDue: number;
  dueDate: string;
  status: 'Pending' | 'Partial' | 'Paid' | 'Late';
  templateId: { id: string; name: string }; // Simple template info for list
  studentId: string; // Keep as string for the list context maybe? Or use StudentInfo? For now, string.
  classId: string;
  // studentName?: string; // Can be derived if studentId is populated later
  // className?: string;
}

// --- Specific Type for Student Search Results ---
export interface StudentSearchResult {
  id: string;
  name: string;
  class: string;
  studentId?: string; // Optional registration ID
}