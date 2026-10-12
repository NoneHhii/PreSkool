import api from './api';

export interface TuitionConfigData {
  academicYear: string;
  semester: number;
  pricePerCredit: number;
  majorId?: string;
  cohort?: string;
}

export interface GenerateInvoiceData {
  studentId: string;
  academicYear: string;
  semester: number;
  dueDate: string;
  extraFees?: { name: string; amount: number }[];
}

export interface PaymentData {
  invoiceId: string;
  amount: number;
  paymentMethod: 'BANK_TRANSFER' | 'MOMO' | 'VNPAY' | 'CASH';
  transactionRef?: string;
}

export const financeService = {
  getConfigs: () => {
    return api.get('/v1/finance/configs');
  },

  createConfig: (data: TuitionConfigData) => {
    return api.post('/v1/finance/configs', data);
  },

  getInvoices: (params?: { studentId?: string; academicYear?: string; semester?: number }) => {
    return api.get('/v1/finance/invoices', { params });
  },

  generateInvoice: (data: GenerateInvoiceData) => {
    return api.post('/v1/finance/invoices/generate', data);
  },

  processPayment: (data: PaymentData) => {
    return api.post('/v1/finance/payments', data);
  },
};
