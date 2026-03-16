"use client";

import { useState } from 'react';
import { CreditCard, Plus, RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function TestPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState('test@example.com');

  const createTestPayment = async () => {
    setLoading(true);
    setError(null);

    const paymentData = {
      user_email: testEmail,
      subscription_id: null,
      razorpay_payment_id: `pay_test_${Date.now()}`,
      razorpay_order_id: `order_test_${Date.now()}`,
      amount: Math.floor(Math.random() * 10000) + 1000,
      currency: 'INR',
      status: 'success',
      payment_method: 'card',
      plan_name: ['free', 'professional', 'enterprise'][Math.floor(Math.random() * 3)],
      billing_cycle: ['monthly', 'yearly'][Math.floor(Math.random() * 2)]
    };

    try {
      const response = await fetch('http://localhost:8000/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });

      if (response.ok) {
        const payment = await response.json();
        console.log('Payment created:', payment);
        // Refresh the payments list
        await fetchPayments();
      } else {
        const errorText = await response.text();
        setError(`Failed to create payment: ${errorText}`);
      }
    } catch (err: any) {
      setError(`Error creating payment: ${err.message}`);
    }

    setLoading(false);
  };

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:8000/api/payments/${testEmail}`);
      
      if (response.ok) {
        const paymentsData = await response.json();
        setPayments(paymentsData);
        console.log('Payments fetched:', paymentsData);
      } else {
        const errorText = await response.text();
        setError(`Failed to fetch payments: ${errorText}`);
      }
    } catch (err: any) {
      setError(`Error fetching payments: ${err.message}`);
    }

    setLoading(false);
  };

  const testProfileEndpoint = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:8000/api/users/${testEmail}/profile`);
      
      if (response.ok) {
        const profileData = await response.json();
        console.log('Profile data:', profileData);
        setPayments(profileData.recent_payments || []);
      } else {
        const errorText = await response.text();
        setError(`Failed to fetch profile: ${errorText}`);
      }
    } catch (err: any) {
      setError(`Error fetching profile: ${err.message}`);
    }

    setLoading(false);
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbol = currency === 'INR' ? '₹' : '$';
    return `${symbol}${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Payment System Test
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Test payment creation and transaction history functionality
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 mb-6 border border-slate-200 dark:border-slate-700">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Test Email
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                placeholder="Enter test email"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={createTestPayment}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors font-semibold"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Create Payment
              </button>
              
              <button
                onClick={fetchPayments}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors font-semibold"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                Fetch Payments
              </button>
              
              <button
                onClick={testProfileEndpoint}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors font-semibold"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                Test Profile API
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={20} className="text-red-500" />
              <h2 className="text-lg font-semibold text-red-900 dark:text-red-100">Error</h2>
            </div>
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {payments.length > 0 && (
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2">
              <CheckCircle size={20} className="text-green-500" />
              <p className="text-green-700 dark:text-green-300 font-semibold">
                Found {payments.length} payment record{payments.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}

        {/* Payments Table */}
        {payments.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Transaction History
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Payment ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Billing
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-slate-900 dark:text-white">
                          {payment.razorpay_payment_id?.slice(0, 16)}...
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-900 dark:text-white">
                          {formatDate(payment.payment_date)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-slate-900 dark:text-white capitalize">
                            {payment.plan_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                          {formatCurrency(payment.amount, payment.currency)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          payment.status === 'success' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-500 dark:text-slate-400 capitalize">
                          {payment.billing_cycle}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {payments.length === 0 && !loading && !error && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-700">
            <CreditCard size={48} className="mx-auto text-slate-400 dark:text-slate-500 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              No Payments Found
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Create a test payment or fetch existing payments to see transaction history
            </p>
          </div>
        )}
      </div>
    </div>
  );
}