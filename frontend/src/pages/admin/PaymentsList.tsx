import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  School,
  Users,
  GraduationCap,
  UserCog,
  CreditCard,
  Check,
  AlertCircle,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { School as SchoolType } from '../../services/adminDashboard.service';

interface PaymentsListProps {
  onBack: () => void;
  schools: SchoolType[];
}

type PaymentStatus = 'paid' | 'pending' | 'overdue';

interface MonthPayment {
  month: string;
  monthNumber: number;
  year: number;
  status: PaymentStatus;
  amount: number;
  paidDate?: string;
  dueDate: string;
}

interface SchoolPaymentData {
  school: SchoolType;
  totalTeachers: number;
  totalStudents: number;
  totalAdmins: number;
  payments: MonthPayment[];
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function PaymentsList({ onBack, schools }: PaymentsListProps) {
  const [loading, setLoading] = useState(true);
  const [schoolPayments, setSchoolPayments] = useState<SchoolPaymentData[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<SchoolPaymentData | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadPaymentData();
  }, [schools]);

  const loadPaymentData = async () => {
    setLoading(true);
    try {
      // Generate mock payment data for each school
      const paymentData: SchoolPaymentData[] = schools.map(school => {
        const currentMonth = new Date().getMonth();
        const payments: MonthPayment[] = MONTHS.map((month, index) => {
          // Random status: paid for past months, pending/overdue for current/future
          let status: PaymentStatus = 'pending';
          if (index < currentMonth) {
            status = Math.random() > 0.2 ? 'paid' : 'overdue';
          } else if (index === currentMonth) {
            status = Math.random() > 0.5 ? 'paid' : 'pending';
          }

          return {
            month,
            monthNumber: index + 1,
            year: selectedYear,
            status,
            amount: 5000, // Fixed amount per month
            paidDate: status === 'paid' ? `${selectedYear}-${String(index + 1).padStart(2, '0')}-15` : undefined,
            dueDate: `${selectedYear}-${String(index + 1).padStart(2, '0')}-10`,
          };
        });

        return {
          school,
          totalTeachers: Math.floor(Math.random() * 20) + 5,
          totalStudents: Math.floor(Math.random() * 200) + 50,
          totalAdmins: Math.floor(Math.random() * 3) + 1,
          payments,
        };
      });

      setSchoolPayments(paymentData);
    } catch (err) {
      console.error('Failed to load payment data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = (payment: MonthPayment) => {
    // Just show alert for now - logic to be added later
    alert(`Payment for ${payment.month} ${payment.year}\nAmount: ₹${payment.amount.toLocaleString()}\n\nPayment integration coming soon!`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Show school payment details
  if (selectedSchool) {
    const paidCount = selectedSchool.payments.filter(p => p.status === 'paid').length;
    const pendingCount = selectedSchool.payments.filter(p => p.status !== 'paid').length;
    const totalPaid = selectedSchool.payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
    const totalPending = selectedSchool.payments.filter(p => p.status !== 'paid').reduce((sum, p) => sum + p.amount, 0);

    return (
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedSchool(null)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
                {selectedSchool.school.name}
              </h1>
              <p className="text-sm text-slate-500">Payment History for {selectedYear}</p>
            </div>
          </div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
          </select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{paidCount}</p>
                <p className="text-sm text-slate-500">Months Paid</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{pendingCount}</p>
                <p className="text-sm text-slate-500">Pending</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">₹{totalPaid.toLocaleString()}</p>
                <p className="text-sm text-slate-500">Total Paid</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">₹{totalPending.toLocaleString()}</p>
                <p className="text-sm text-slate-500">Due Amount</p>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Payments Grid */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-800 mb-4">Monthly Payments</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {selectedSchool.payments.map((payment) => (
              <div
                key={payment.month}
                className={`p-4 rounded-xl border-2 ${
                  payment.status === 'paid' 
                    ? 'border-green-200 bg-green-50' 
                    : payment.status === 'overdue'
                    ? 'border-red-200 bg-red-50'
                    : 'border-yellow-200 bg-yellow-50'
                }`}
              >
                <div className="text-center">
                  <p className="font-medium text-slate-700">{payment.month.slice(0, 3)}</p>
                  <p className="text-lg font-bold text-slate-800 my-1">₹{payment.amount.toLocaleString()}</p>
                  
                  {payment.status === 'paid' ? (
                    <div className="flex items-center justify-center gap-1 text-green-600 text-sm">
                      <Check className="w-4 h-4" />
                      <span>Paid</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handlePayNow(payment)}
                      className={`w-full mt-2 py-1.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                        payment.status === 'overdue'
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-yellow-600 text-white hover:bg-yellow-700'
                      }`}
                    >
                      <CreditCard className="w-3 h-3 inline-block mr-1" />
                      Pay Now
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show school cards
  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Payments</h1>
            <p className="text-sm text-slate-500">Manage school payments and subscriptions</p>
          </div>
        </div>
      </div>

      {/* School Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {schoolPayments.map((data) => {
          const paidMonths = data.payments.filter(p => p.status === 'paid').length;
          const pendingAmount = data.payments.filter(p => p.status !== 'paid').reduce((sum, p) => sum + p.amount, 0);

          return (
            <div
              key={data.school.id}
              onClick={() => setSelectedSchool(data)}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:border-blue-300 cursor-pointer transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <School className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 line-clamp-1">{data.school.name}</h3>
                    <p className="text-xs text-slate-500">{data.school.udise_code || 'School'}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 bg-slate-50 rounded-lg">
                  <Users className="w-4 h-4 mx-auto text-blue-600 mb-1" />
                  <p className="text-lg font-bold text-slate-800">{data.totalTeachers}</p>
                  <p className="text-xs text-slate-500">Teachers</p>
                </div>
                <div className="text-center p-2 bg-slate-50 rounded-lg">
                  <GraduationCap className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
                  <p className="text-lg font-bold text-slate-800">{data.totalStudents}</p>
                  <p className="text-xs text-slate-500">Students</p>
                </div>
                <div className="text-center p-2 bg-slate-50 rounded-lg">
                  <UserCog className="w-4 h-4 mx-auto text-purple-600 mb-1" />
                  <p className="text-lg font-bold text-slate-800">{data.totalAdmins}</p>
                  <p className="text-xs text-slate-500">Admins</p>
                </div>
              </div>

              {/* Payment Status */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-green-600">
                    <Check className="w-4 h-4" />
                    <span className="text-sm font-medium">{paidMonths}/12</span>
                  </div>
                  <span className="text-xs text-slate-400">months paid</span>
                </div>
                {pendingAmount > 0 && (
                  <span className="text-sm font-semibold text-red-600">
                    ₹{pendingAmount.toLocaleString()} due
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {schools.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <School className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No schools found</p>
        </div>
      )}
    </div>
  );
}

