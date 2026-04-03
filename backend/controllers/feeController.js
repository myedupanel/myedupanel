const prisma = require('../config/prisma');

// Mock implementations for now - these should be properly implemented based on your requirements
const getDashboardOverview = async (req, res) => {
  try {
    // Mock data - replace with actual implementation
    const data = {
      lateCollection: { amount: 0, studentCount: 0 },
      onlinePayment: { transactionCount: 0, totalStudents: 0 },
      depositCollection: { amount: 0, studentCount: 0 },
      schoolCollection: { collected: 0, goal: 100000 }
    };
    res.json(data);
  } catch (error) {
    console.error('Error in getDashboardOverview:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard overview' });
  }
};

const getFeeTemplates = async (req, res) => {
  try {
    const templates = await prisma.feeTemplate.findMany({
      where: { schoolId: req.user.schoolId }
    });
    // Ensure items is always an array for the frontend
    const normalized = templates.map(t => ({ ...t, items: t.items || [] }));
    res.json(normalized);
  } catch (error) {
    console.error('Error in getFeeTemplates:', error);
    res.status(500).json({ error: 'Failed to fetch fee templates' });
  }
};

const getTemplateDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const template = await prisma.feeTemplate.findUnique({
      where: { id: parseInt(id) }
    });
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    // Normalize items for clients
    res.json({ ...template, items: template.items || [] });
  } catch (error) {
    console.error('Error in getTemplateDetails:', error);
    res.status(500).json({ error: 'Failed to fetch template details' });
  }
};

const getLatePayments = async (req, res) => {
  try {
    // Mock implementation
    res.json([]);
  } catch (error) {
    console.error('Error in getLatePayments:', error);
    res.status(500).json({ error: 'Failed to fetch late payments' });
  }
};

const calculateLateFees = async (req, res) => {
  try {
    // Mock implementation
    res.json({ message: 'Late fees calculated successfully' });
  } catch (error) {
    console.error('Error in calculateLateFees:', error);
    res.status(500).json({ error: 'Failed to calculate late fees' });
  }
};

const sendLateFeeReminders = async (req, res) => {
  try {
    // Mock implementation
    res.json({ message: 'Late fee reminders sent successfully' });
  } catch (error) {
    console.error('Error in sendLateFeeReminders:', error);
    res.status(500).json({ error: 'Failed to send late fee reminders' });
  }
};

const getStudentFeeRecords = async (req, res) => {
  try {
    // Mock implementation
    res.json({ data: [] });
  } catch (error) {
    console.error('Error in getStudentFeeRecords:', error);
    res.status(500).json({ error: 'Failed to fetch student fee records' });
  }
};

const getProcessingPayments = async (req, res) => {
  try {
    // Mock implementation
    res.json([]);
  } catch (error) {
    console.error('Error in getProcessingPayments:', error);
    res.status(500).json({ error: 'Failed to fetch processing payments' });
  }
};

const getEditedRecords = async (req, res) => {
  try {
    // Mock implementation
    res.json([]);
  } catch (error) {
    console.error('Error in getEditedRecords:', error);
    res.status(500).json({ error: 'Failed to fetch edited records' });
  }
};

const getPdcRecords = async (req, res) => {
  try {
    // Mock implementation
    res.json([]);
  } catch (error) {
    console.error('Error in getPdcRecords:', error);
    res.status(500).json({ error: 'Failed to fetch PDC records' });
  }
};

const assignAndCollectFee = async (req, res) => {
  try {
    // Mock implementation
    res.json({ message: 'Fee assigned and collected successfully' });
  } catch (error) {
    console.error('Error in assignAndCollectFee:', error);
    res.status(500).json({ error: 'Failed to assign and collect fee' });
  }
};

const createFeeTemplate = async (req, res) => {
  try {
    console.log('[createFeeTemplate] incoming request body:', req.body);
    console.log('[createFeeTemplate] authenticated user:', req.user && { id: req.user.id, role: req.user.role, schoolId: req.user.schoolId });
    const { name, description, items } = req.body;

    // Validate input
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Invalid payload: name is required and must be a string.' });
    }
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Invalid payload: items array is required and must not be empty.' });
    }

    // Ensure amounts are numbers
    const sanitizedItems = items.map((it) => {
      const amount = Number(it.amount);
      if (isNaN(amount)) {
        throw new Error(`Invalid amount for item: ${it.name}`);
      }
      return {
        name: it.name || '',
        amount: amount,
      };
    });

    const totalAmount = sanitizedItems.reduce((s, it) => s + it.amount, 0);

    const schoolId = req.user?.schoolId;
    if (!schoolId) {
      return res.status(403).json({ error: 'User not associated with a school.' });
    }

    console.log('[createFeeTemplate] creating template with data:', {
      name,
      description: description || '',
      items: sanitizedItems,
      totalAmount,
      schoolId
    });

    const created = await prisma.feeTemplate.create({
      data: {
        name,
        description: description || '',
        items: sanitizedItems,
        totalAmount: totalAmount,
        schoolId
      }
    });

    console.log('[createFeeTemplate] created template id=', created.id);

    return res.status(201).json({ message: 'Fee template created successfully', template: created });
  } catch (error) {
    console.error('Error in createFeeTemplate:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      meta: error.meta,
      stack: error.stack
    });
    
    // Handle unique constraint (template name per school)
    if (error.code === 'P2002' && error.meta && error.meta.target && error.meta.target.includes('name')) {
      return res.status(409).json({ error: 'A template with this name already exists for this school.' });
    }

    // Handle Prisma errors
    if (error.code && error.code.startsWith('P')) {
      return res.status(400).json({ 
        error: 'Database error occurred',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined 
      });
    }

    // Generic error
    return res.status(500).json({ 
      error: 'Failed to create fee template',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

const updateFeeTemplate = async (req, res) => {
  try {
    // Mock implementation
    res.json({ message: 'Fee template updated successfully' });
  } catch (error) {
    console.error('Error in updateFeeTemplate:', error);
    res.status(500).json({ error: 'Failed to update fee template' });
  }
};

const deleteFeeTemplate = async (req, res) => {
  try {
    // Mock implementation
    res.json({ message: 'Fee template deleted successfully' });
  } catch (error) {
    console.error('Error in deleteFeeTemplate:', error);
    res.status(500).json({ error: 'Failed to delete fee template' });
  }
};

const getSampleSheet = async (req, res) => {
  try {
    // Mock implementation
    res.json({ message: 'Sample sheet data' });
  } catch (error) {
    console.error('Error in getSampleSheet:', error);
    res.status(500).json({ error: 'Failed to fetch sample sheet' });
  }
};

const updateExistingRecords = async (req, res) => {
  try {
    // Mock implementation
    res.json({ message: 'Existing records updated successfully' });
  } catch (error) {
    console.error('Error in updateExistingRecords:', error);
    res.status(500).json({ error: 'Failed to update existing records' });
  }
};

const exportDetailReport = async (req, res) => {
  try {
    // Mock implementation
    res.json({ message: 'Detail report exported successfully' });
  } catch (error) {
    console.error('Error in exportDetailReport:', error);
    res.status(500).json({ error: 'Failed to export detail report' });
  }
};

const getPaidTransactions = async (req, res) => {
  try {
    // Mock implementation
    res.json([]);
  } catch (error) {
    console.error('Error in getPaidTransactions:', error);
    res.status(500).json({ error: 'Failed to fetch paid transactions' });
  }
};

const getFailedTransactions = async (req, res) => {
  try {
    // Mock implementation
    res.json([]);
  } catch (error) {
    console.error('Error in getFailedTransactions:', error);
    res.status(500).json({ error: 'Failed to fetch failed transactions' });
  }
};

const getPaymentHistory = async (req, res) => {
  try {
    // Mock implementation
    res.json([]);
  } catch (error) {
    console.error('Error in getPaymentHistory:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
};

const collectManualFee = async (req, res) => {
<<<<<<< HEAD
    console.log("[collectManualFee] START - Received request body:", req.body);
    
    try {
        // === FIX 7: USER INPUT KO SANITIZE KAREIN ===
        const sanitizedBody = {};
        for (const key in req.body) {
            sanitizedBody[key] = removeHtmlTags(req.body[key]);
        }
        const { feeRecordId, amountPaid: amountPaidString, paymentMode, paymentDate, notes, chequeNumber, bankName } = sanitizedBody;
        console.log("[collectManualFee] Sanitized body:", sanitizedBody);
        // === END FIX 7 ===

        const schoolId = req.user.schoolId; 
        const collectedByUserId = req.user.id; 
        const collectedByName = req.user.name || 'Admin';
        
        console.log("[collectManualFee] User context - School ID:", schoolId, "User ID:", collectedByUserId);
        
        const feeRecordIdInt = parseInt(feeRecordId); 
        if (isNaN(feeRecordIdInt)) {
            console.log("[collectManualFee] Invalid feeRecordId:", feeRecordId);
            return res.status(400).json({ msg: 'Invalid or missing Fee Record ID.' });
        }
        
        const amountPaid = Number(amountPaidString); 
        if (isNaN(amountPaid) || amountPaid <= 0) {
            console.log("[collectManualFee] Invalid amountPaid:", amountPaidString);
            return res.status(400).json({ msg: 'Invalid or missing Amount Paid.' });
        }
        
        if (!paymentMode) {
            console.log("[collectManualFee] Missing paymentMode");
            return res.status(400).json({ msg: 'Payment Mode is required.' }); 
        }
        
        // Cheque check ab Sanitized ChequeNumber par hoga
        if (paymentMode === 'Cheque' && !chequeNumber) {
            console.log("[collectManualFee] Missing chequeNumber for Cheque payment");
            return res.status(400).json({ msg: 'Cheque number is required.' });
        }
        
        const paymentDateObj = paymentDate ? new Date(paymentDate) : new Date();
        console.log("[collectManualFee] Payment date:", paymentDateObj);
        
        let updatedFeeRecord; 
        let newTransaction;

        console.log(`[collectManualFee] Starting transaction for fee record ID: ${feeRecordIdInt}, School ID: ${schoolId}`);
        
        const result = await prisma.$transaction(async (tx) => {
            console.log(`[collectManualFee] Inside transaction - Looking for fee record ID: ${feeRecordIdInt}, School ID: ${schoolId}`);
            
            // First check if fee record exists
            const feeRecord = await tx.feeRecord.findUnique({ 
                where: { id: feeRecordIdInt } 
            });
            
            console.log("[collectManualFee] Found fee record:", feeRecord);
            
            if (!feeRecord) {
                console.log(`[collectManualFee] Fee record not found with ID: ${feeRecordIdInt}`);
                throw new Error(`Fee Record with ID ${feeRecordIdInt} not found.`);
            }
            
            // Check if fee record belongs to the same school
            if (feeRecord.schoolId !== schoolId) {
                console.log(`[collectManualFee] School ID mismatch. Record school: ${feeRecord.schoolId}, User school: ${schoolId}`);
                throw new Error('Fee Record does not belong to your school.');
            }
            
            // Check amount validation
            if (amountPaid > feeRecord.balanceDue + 0.01) {
                console.log(`[collectManualFee] Amount exceeds balance. Paid: ${amountPaid}, Balance: ${feeRecord.balanceDue}`);
                throw new Error(`Amount paid (${amountPaid}) exceeds balance due (${feeRecord.balanceDue})`);
            }
            
            console.log("[collectManualFee] Validation passed. Creating transaction...");
            
            const receiptId = `TXN-${Date.now()}`; 
            const transactionStatus = (paymentMode === 'Cheque') ? 'Pending' : 'Success';
            
            console.log("[collectManualFee] Creating transaction with data:", { 
                receiptId, 
                feeRecordId: feeRecord.id, 
                studentId: feeRecord.studentId, 
                classId: feeRecord.classId, 
                schoolId, 
                templateId: feeRecord.templateId, 
                amountPaid: amountPaid, 
                paymentDate: paymentDateObj, 
                paymentMode, 
                status: transactionStatus, 
                collectedById: collectedByUserId,
                notes, 
                chequeNumber, 
                bankName 
            });
            
            newTransaction = await tx.transaction.create({ 
                data: { 
                    receiptId, 
                    feeRecordId: feeRecord.id, 
                    studentId: feeRecord.studentId, 
                    classId: feeRecord.classId, 
                    schoolId, 
                    templateId: feeRecord.templateId, 
                    amountPaid: amountPaid, 
                    paymentDate: paymentDateObj, 
                    paymentMode, 
                    status: transactionStatus, 
                    collectedById: collectedByUserId, 
                    notes, 
                    chequeNumber, 
                    bankName // <--- SANITIZED DATA
                } 
            });
            
            console.log("[collectManualFee] Transaction created:", newTransaction);
            
            if (newTransaction.status === 'Success') {
                console.log("[collectManualFee] Updating fee record for successful transaction");
                const newAmountPaid = feeRecord.amountPaid + amountPaid; 
                const newBalanceDue = feeRecord.balanceDue - amountPaid;
                updatedFeeRecord = await tx.feeRecord.update({ 
                    where: { id: feeRecord.id }, 
                    data: { 
                        amountPaid: newAmountPaid, 
                        balanceDue: newBalanceDue < 0 ? 0 : newBalanceDue, 
                        status: newBalanceDue < 0.01 ? 'Paid' : 'Partial' 
                    } 
                });
                console.log("[collectManualFee] Fee record updated:", updatedFeeRecord);
            } else { 
                updatedFeeRecord = feeRecord; 
                console.log("[collectManualFee] Keeping fee record unchanged for pending transaction");
            }
            
            return { newTransaction, updatedFeeRecord };
        });

        console.log("[collectManualFee] Transaction completed successfully. Fetching additional data...");
        
        // Socket logic and response (No Change)
        const studentInfo = await prisma.students.findUnique({ 
            where: { studentid: result.updatedFeeRecord.studentId }, 
            include: { class: { select: { class_name: true } } } 
        });
        
        const templateInfo = await prisma.feeTemplate.findUnique({ 
            where: { id: result.updatedFeeRecord.templateId } 
        });
        
        const schoolInfo = await prisma.school.findUnique({ 
            where: { id: schoolId } 
        });
        
        const populatedTransaction = { 
            ...result.newTransaction, 
            studentName: getFullName(studentInfo) || 'N/A', 
            className: studentInfo?.class?.class_name || 'N/A', 
            templateName: templateInfo?.name || 'N/A', 
            collectedByName: collectedByName, 
            schoolInfo: { 
                name: schoolInfo?.name || 'School Name', 
                address: schoolInfo?.address || 'School Address', 
                logo: schoolInfo?.logo 
            } 
        };
        
        console.log("[collectManualFee] Populated transaction:", populatedTransaction);
        
        if (req.io) { 
            console.log("[Manual Collect] Emitting Socket events..."); 
            req.io.emit('updateDashboard'); 
            req.io.emit('fee_record_updated', result.updatedFeeRecord); 
            req.io.emit('transaction_added', populatedTransaction); 
            if (result.newTransaction.status === 'Success') { 
                req.io.emit('new_transaction_feed', { 
                    name: studentInfo ? getFullName(studentInfo) : 'A Student', 
                    amount: result.newTransaction.amountPaid 
                }); 
            } 
        } else { 
            console.warn('[Manual Collect] Socket.IO instance (req.io) not found.'); 
        }
        
        console.log("[collectManualFee] Sending success response");
        res.status(201).json({ message: 'Fee collected successfully', transaction: populatedTransaction });
        
    } catch (error) { 
        console.error('[collectManualFee] ERROR:', error);
        console.error('[collectManualFee] ERROR stack:', error.stack);
        res.status(500).json({ 
            msg: `Server error: ${error.message}`,
            error: error.message,
            // Only include stack in development
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        }); 
    }
=======
  try {
    // Mock implementation
    res.json({ message: 'Manual fee collected successfully' });
  } catch (error) {
    console.error('Error in collectManualFee:', error);
    res.status(500).json({ error: 'Failed to collect manual fee' });
  }
>>>>>>> 1111f0618edff54adadf0e97c6ded36c47715662
};

const getTransactionById = async (req, res) => {
<<<<<<< HEAD
     try {
        // Access Control Check (where: { id: ..., schoolId: ... }) perfect hai
        const transactionIdInt = parseInt(req.params.id); const schoolId = req.user.schoolId; if (isNaN(transactionIdInt)) return res.status(400).json({ message: 'Invalid Transaction ID' });
        
        const transaction = await prisma.transaction.findUnique({ where: { id: transactionIdInt, schoolId: schoolId }, include: { student: { include: { class: { select: { class_name: true } } } }, template: { select: { name: true, items: true } }, collectedBy: { select: { name: true } } } });
        
        if (!transaction) return res.status(404).json({ message: 'Transaction not found or access denied.' });
        
        const feeRecord = await prisma.feeRecord.findUnique({ 
            where: { id: transaction.feeRecordId }, 
            select: { 
                amount: true, 
                discount: true, 
                lateFine: true, 
                balanceDue: true, 
                status: true      
            } 
        });
        
        const schoolInfo = await prisma.school.findUnique({ where: { id: schoolId }, select: { name: true, name2: true, address: true, logo: true, session: true, udiseNo: true } });
        
        const receiptData = { 
            ...transaction, 
            studentName: getFullName(transaction.student) || 'N/A', 
            studentRegId: transaction.student?.roll_number || 'N/A', 
            className: transaction.student?.class?.class_name || 'N/A', 
            templateName: transaction.template?.name || 'N/A', 
            templateItems: transaction.template?.items, 
            collectedByName: transaction.collectedBy?.name || (transaction.paymentMode === 'Online' ? 'System (Online)' : 'N/A'), 
            totalFeeAmount: feeRecord?.amount || 0, 
            discountGiven: feeRecord?.discount || 0, 
            lateFineApplied: feeRecord?.lateFine || 0, 
            currentBalanceDue: feeRecord?.balanceDue ?? 0, 
            feeRecordStatus: feeRecord?.status || 'Pending', 

            schoolInfo: { 
                name: schoolInfo?.name || 'School Name', 
                address: schoolInfo?.address || 'School Address', 
                logo: schoolInfo?.logo, 
                session: schoolInfo?.session || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}` 
            } 
        };

        delete receiptData.student; delete receiptData.template; delete receiptData.collectedBy;
        res.status(200).json(receiptData);
      } catch (error) { console.error("Error fetching transaction for receipt:", error); res.status(500).send("Server Error"); }
=======
  try {
    // Mock implementation
    res.json({});
  } catch (error) {
    console.error('Error in getTransactionById:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
};

const getFeeRecordById = async (req, res) => {
  try {
    // Mock implementation
    res.json({});
  } catch (error) {
    console.error('Error in getFeeRecordById:', error);
    res.status(500).json({ error: 'Failed to fetch fee record' });
  }
>>>>>>> 1111f0618edff54adadf0e97c6ded36c47715662
};

const getClasswiseReport = async (req, res) => {
  try {
    // Mock implementation
    res.json([]);
  } catch (error) {
    console.error('Error in getClasswiseReport:', error);
    res.status(500).json({ error: 'Failed to fetch classwise report' });
  }
};

const getStudentReportByClass = async (req, res) => {
  try {
    // Mock implementation
    res.json([]);
  } catch (error) {
    console.error('Error in getStudentReportByClass:', error);
    res.status(500).json({ error: 'Failed to fetch student report by class' });
  }
};

const getTransactions = async (req, res) => {
  try {
    // Mock implementation
    res.json({ data: [] });
  } catch (error) {
    console.error('Error in getTransactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

const exportFeeData = async (req, res) => {
  try {
    // Mock implementation
    res.json({ message: 'Fee data exported successfully' });
  } catch (error) {
    console.error('Error in exportFeeData:', error);
    res.status(500).json({ error: 'Failed to export fee data' });
  }
};

module.exports = {
  getDashboardOverview,
  getFeeTemplates,
  getTemplateDetails,
  getLatePayments,
  calculateLateFees,
  sendLateFeeReminders,
  getStudentFeeRecords,
  getProcessingPayments,
  getEditedRecords,
  getPdcRecords,
  assignAndCollectFee,
  createFeeTemplate,
  updateFeeTemplate,
  deleteFeeTemplate,
  getSampleSheet,
  updateExistingRecords,
  exportDetailReport,
  getPaidTransactions,
  getFailedTransactions,
  getPaymentHistory,
  collectManualFee,
  getTransactionById,
  getFeeRecordById,
  getClasswiseReport,
  getStudentReportByClass,
  getTransactions,
  exportFeeData
};