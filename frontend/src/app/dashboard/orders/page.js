"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortAZ, setSortAZ] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get("/orders");
      if (user?.role === 'pharma') {
        setOrders(response.data.filter(order => order.status === 'confirmed'));
      } else {
        setOrders(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort orders based on search query and sort state
  const filteredAndSortedOrders = orders
    .filter(order => {
      const searchLower = searchQuery.toLowerCase();
      const matchesOrderNumber = order.orderNumber.toLowerCase().includes(searchLower);
      const matchesCompanyName = user?.role === 'medical_store'
        ? order.pharmaCompany.companyName.toLowerCase().includes(searchLower)
        : order.medicalStore.companyName.toLowerCase().includes(searchLower);
      const matchesProducts = order.items.some(item => 
        item.product.name.toLowerCase().includes(searchLower)
      );
      return matchesOrderNumber || matchesCompanyName || matchesProducts;
    })
    .sort((a, b) => {
      if (!sortAZ) return 0;
      const companyNameA = user?.role === 'medical_store'
        ? a.pharmaCompany.companyName
        : a.medicalStore.companyName;
      const companyNameB = user?.role === 'medical_store'
        ? b.pharmaCompany.companyName
        : b.medicalStore.companyName;
      return companyNameA.localeCompare(companyNameB);
    });

  const togglePaymentStatus = async (orderId, itemId, isPaid) => {
    if (user?.role !== 'pharma') return; // Only pharma users can toggle payment status
    
    try {
      await api.patch(`/orders/${orderId}/items/${itemId}/payment`, { isPaid });
      await fetchOrders();
    } catch (err) {
      console.error('Error updating payment status:', err);
    }
  };

  const downloadInvoice = async (orderId) => {
    try {
      setError(null);
      
      const response = await api.get(`/invoice/orders/${orderId}`, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/pdf'
        }
      });

      if (response.status === 200 && response.data instanceof Blob) {
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `invoice-${orderId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error downloading invoice:', err);
      if (err.response?.status === 404) {
        setError('Order not found. Please check the order ID and try again.');
      } else if (err.response?.status === 500) {
        setError('Error generating invoice. Please try again later.');
      } else {
        setError(err.response?.data?.message || "Failed to download invoice");
      }
    }
  };

  if (loading) return <div className="text-center p-4">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Orders ({filteredAndSortedOrders.length} total)</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search orders by name, batch number, or pharma company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-96 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setSortAZ(!sortAZ)}
            className={`px-4 py-2 rounded-md ${
              sortAZ 
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            A-Z
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {user?.role === 'medical_store' ? 'Pharma Company' : 'Medical Store'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price per Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedOrders.map((order) => (
              order.items.map((item, index) => (
                <tr key={`${order._id}-${index}`}>
                  <td className="px-6 py-4 whitespace-nowrap">{order.orderNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user?.role === 'medical_store' 
                      ? order.pharmaCompany.companyName 
                      : order.medicalStore.companyName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.product.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap">₹{item.price}</td>
                  <td className="px-6 py-4 whitespace-nowrap">₹{item.quantity * item.price}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user?.role === 'pharma' ? (
                      <button
                        onClick={() => togglePaymentStatus(order._id, item._id, !item.isPaid)}
                        className={`w-24 py-2 rounded-md text-sm font-medium ${
                          item.isPaid 
                            ? 'bg-green-500 text-white'
                            : 'bg-red-500 text-white'
                        }`}
                      >
                        {item.isPaid ? 'Paid' : 'Unpaid'}
                      </button>
                    ) : (
                      <span
                        className={`w-24 py-2 rounded-md text-sm font-medium inline-block text-center ${
                          item.isPaid 
                            ? 'bg-green-500 text-white'
                            : 'bg-red-500 text-white'
                        }`}
                      >
                        {item.isPaid ? 'Paid' : 'Unpaid'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => downloadInvoice(order._id)}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Download Invoice
                    </button>
                  </td>
                </tr>
              ))
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 