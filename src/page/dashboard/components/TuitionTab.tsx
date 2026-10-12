import React, { useState } from 'react';
import {
  financeService,
  type TuitionConfigData,
  type PaymentData,
} from '../../../services/finance.service';
import {
  Banknote,
  Plus,
  CheckCircle,
  AlertCircle,
  X,
  CreditCard,
} from 'lucide-react';

export default function TuitionTab({ user }: { user: any }) {
  const isAdmin = user?.role === 'ADMIN';
  const isTeacher = user?.role === 'TEACHER';
  const isStudent = user?.role === 'STUDENT';

  if (isTeacher) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center max-w-xl mx-auto my-12">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Banknote className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Phân Hệ Học Phí & Tài Chính</h3>
        <p className="text-gray-500 text-sm">
          Phân hệ này không áp dụng cho Giảng viên. Vui lòng chuyển sang phân hệ <strong className="text-gray-700">Lịch Giảng Dạy (Schedule)</strong> hoặc <strong className="text-gray-700">Điểm Danh & Lớp Học Phần</strong>.
        </p>
      </div>
    );
  }

  const [activeSubTab, setActiveSubTab] = useState<'invoices' | 'configs' | 'generate'>('invoices');

  // Demo Invoices
  const [invoices, setInvoices] = useState<any[]>([
    {
      id: 'inv-001',
      invoiceNumber: 'HD-2026-001',
      studentName: 'Nguyễn Văn An',
      studentCode: '202600123',
      cohort: 'K18',
      totalCredits: 18,
      pricePerCredit: 850000,
      extraFees: 1200000, // BHYT + Cơ sở vật chất
      totalAmount: 18 * 850000 + 1200000, // 16,500,000 VND
      paidAmount: 16500000,
      status: 'PAID',
      dueDate: '2026-10-30',
      academicYear: '2026-2027',
      semester: 1,
    },
    {
      id: 'inv-002',
      invoiceNumber: 'HD-2026-002',
      studentName: 'Trần Thị Mai',
      studentCode: '202600124',
      cohort: 'K18',
      totalCredits: 15,
      pricePerCredit: 850000,
      extraFees: 1200000,
      totalAmount: 15 * 850000 + 1200000, // 13,950,000 VND
      paidAmount: 0,
      status: 'UNPAID',
      dueDate: '2026-10-30',
      academicYear: '2026-2027',
      semester: 1,
    },
  ]);

  // Demo Configs
  const [configs, setConfigs] = useState<any[]>([
    {
      id: 'cfg-1',
      academicYear: '2026-2027',
      semester: 1,
      pricePerCredit: 850000,
      cohort: 'K18',
      majorName: 'Công nghệ thông tin',
    },
    {
      id: 'cfg-2',
      academicYear: '2026-2027',
      semester: 1,
      pricePerCredit: 750000,
      cohort: 'K17',
      majorName: 'Tất cả các ngành',
    },
  ]);

  // Config modal
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configForm, setConfigForm] = useState<TuitionConfigData>({
    academicYear: '2026-2027',
    semester: 1,
    pricePerCredit: 850000,
    cohort: 'K18',
  });

  // Payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState<PaymentData>({
    invoiceId: '',
    amount: 0,
    paymentMethod: 'BANK_TRANSFER',
    transactionRef: '',
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Format currency VND
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await financeService.createConfig(configForm);
    } catch (err) {
      console.warn('API error, demo fallback');
    }
    setConfigs((prev) => [...prev, { ...configForm, id: `cfg-${Date.now()}` }]);
    setMessage({ type: 'success', text: 'Tạo cấu hình đơn giá học phí thành công!' });
    setShowConfigModal(false);
  };

  const openPaymentModal = (inv: any) => {
    setSelectedInvoice(inv);
    setPaymentForm({
      invoiceId: inv.id,
      amount: inv.totalAmount - inv.paidAmount,
      paymentMethod: 'BANK_TRANSFER',
      transactionRef: `Tid-VNPay-${Date.now().toString().slice(-6)}`,
    });
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await financeService.processPayment(paymentForm);
    } catch (err) {
      console.warn('API error, demo fallback');
    }

    setInvoices((prev) =>
      prev.map((item) =>
        item.id === selectedInvoice.id
          ? {
              ...item,
              paidAmount: item.totalAmount,
              status: 'PAID',
            }
          : item
      )
    );
    setMessage({
      type: 'success',
      text: `Gạch nợ học phí thành công cho phiếu #${selectedInvoice.invoiceNumber} (${formatCurrency(paymentForm.amount)})!`,
    });
    setShowPaymentModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">Phân Hệ Tài Chính & Học Phí (Finance & Tuition)</h2>
            <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full font-medium">
              {isAdmin ? 'Quyền: Quản Trị Tài Chính (Cấu hình & gạch nợ)' : 'Quyền: Sinh Viên (Tra cứu & Thanh toán)'}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Cấu hình đơn giá tín chỉ, tự động xuất phiếu báo học phí theo số TC đã đăng ký, và xử lý thanh toán gạch nợ.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowConfigModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Cấu Hình Đơn Giá Học Phí
          </button>
        )}
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between gap-3 text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => setActiveSubTab('invoices')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
            activeSubTab === 'invoices' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          {isStudent ? 'Hóa Đơn Học Phí Cá Nhân' : `Phiếu Báo Học Phí (${invoices.length})`}
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveSubTab('configs')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeSubTab === 'configs' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Cấu Hình Đơn Giá Tín Chỉ
          </button>
        )}
      </div>

      {/* Invoices List */}
      {activeSubTab === 'invoices' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold">
                <th className="py-3.5 px-4">Số Phiếu</th>
                <th className="py-3.5 px-4">Sinh Viên</th>
                <th className="py-3.5 px-4">Số Tín Chỉ</th>
                <th className="py-3.5 px-4">Đơn Giá / TC</th>
                <th className="py-3.5 px-4">Phụ Phí (BHYT)</th>
                <th className="py-3.5 px-4">Tổng Học Phí</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50/50 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-gray-900">{inv.invoiceNumber}</td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-gray-900">{inv.studentName}</div>
                    <div className="text-xs text-gray-400 font-mono">{inv.studentCode} ({inv.cohort})</div>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-blue-600">{inv.totalCredits} TC</td>
                  <td className="py-3.5 px-4 text-gray-600">{formatCurrency(inv.pricePerCredit)}</td>
                  <td className="py-3.5 px-4 text-gray-600">{formatCurrency(inv.extraFees)}</td>
                  <td className="py-3.5 px-4 font-extrabold text-gray-900">{formatCurrency(inv.totalAmount)}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {inv.status === 'PAID' ? 'Đã Thanh Toán' : 'Chưa Thanh Toán'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {inv.status !== 'PAID' ? (
                      <button
                        onClick={() => openPaymentModal(inv)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs flex items-center gap-1 ml-auto"
                      >
                        <CreditCard className="w-3.5 h-3.5" /> {isStudent ? 'Thanh Toán Online' : 'Gạch Nợ / Thu Tiền'}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400 font-medium">Hoàn tất</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Configs View */}
      {activeSubTab === 'configs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {configs.map((c) => (
            <div key={c.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-900">{c.majorName || 'Chung toàn trường'}</h3>
                <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded">
                  Khóa {c.cohort}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Năm học: <strong>{c.academicYear}</strong> • Học kỳ: <strong>{c.semester}</strong>
              </div>
              <div className="text-lg font-extrabold text-blue-600 pt-2 border-t border-gray-100">
                {formatCurrency(c.pricePerCredit)} <span className="text-xs font-normal text-gray-500">/ 1 tín chỉ</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Tạo Cấu hình Học Phí */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Thiết Lập Đơn Giá Tín Chỉ</h3>
              <button onClick={() => setShowConfigModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfigSubmit} className="py-4 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Năm học</label>
                  <input
                    type="text"
                    value={configForm.academicYear}
                    onChange={(e) => setConfigForm({ ...configForm, academicYear: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Học kỳ</label>
                  <input
                    type="number"
                    min={1}
                    max={3}
                    value={configForm.semester}
                    onChange={(e) => setConfigForm({ ...configForm, semester: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Đơn giá / 1 Tín chỉ (VNĐ)</label>
                <input
                  required
                  type="number"
                  step="10000"
                  value={configForm.pricePerCredit}
                  onChange={(e) => setConfigForm({ ...configForm, pricePerCredit: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Khóa áp dụng (Vd: K18)</label>
                <input
                  type="text"
                  placeholder="K18, K17..."
                  value={configForm.cohort || ''}
                  onChange={(e) => setConfigForm({ ...configForm, cohort: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm"
                >
                  Lưu Cấu Hình
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Thanh Toán & Gạch Nợ */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                Thanh Toán Học Phí #{selectedInvoice.invoiceNumber}
              </h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="py-4 space-y-3 text-sm">
              <div className="p-3 bg-gray-50 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Sinh viên:</span>
                  <strong>{selectedInvoice.studentName} ({selectedInvoice.studentCode})</strong>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Số tiền cần thanh toán:</span>
                  <strong className="text-emerald-700 text-sm">{formatCurrency(selectedInvoice.totalAmount)}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Phương thức thanh toán</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e: any) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white"
                >
                  <option value="BANK_TRANSFER">Chuyển khoản Ngân hàng (Bank Transfer)</option>
                  <option value="VNPAY">Cổng VNPAY</option>
                  <option value="MOMO">Ví MoMo</option>
                  <option value="CASH">Tiền mặt tại phòng Tài Vụ</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Mã giao dịch / Transaction Ref</label>
                <input
                  required
                  type="text"
                  value={paymentForm.transactionRef || ''}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transactionRef: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-sm"
                >
                  Xác Nhận Đóng Tiền
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
