"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";
import api from "@/lib/axios";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function MedicalStoreDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockProducts: 0,
    expiringProducts: 0,
    supplierDistribution: {},
    inventoryStatus: {
      inStock: 0,
      lowStock: 0,
      outOfStock: 0,
    },
  });
  const [medicalStores, setMedicalStores] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("normal"); // normal, a-z
  const [filteredOrders, setFilteredOrders] = useState([]);

  const formatAddress = (address) => {
    if (!address) return 'No address provided';
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.pincode) parts.push(address.pincode);
    return parts.join(', ') || 'No address provided';
  };

  useEffect(() => {
    if (!user) return;
    if (user.role === "medical_store") {
      fetchStats();
    } else if (user.role === "pharma") {
      fetchOrders();
    } else {
      router.push("/dashboard");
    }
  }, [user]);

  useEffect(() => {
    if (orders.length > 0) {
      let result = [...orders];
      if (searchTerm) {
        result = result.filter(order => 
          order.medicalStore.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.items.some(item => 
            item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.product.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())
          )
        );
      }
      if (sortOrder === "a-z") {
        result.sort((a, b) => a.medicalStore.companyName.localeCompare(b.medicalStore.companyName));
      }
      setFilteredOrders(result);
    }
  }, [searchTerm, sortOrder, orders]);

  const fetchStats = async () => {
    try {
      const response = await axios.get("/api/medical-store/stats");
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setError(null);
      const response = await api.get('/pharma/ordered-medicals');
      setOrders(response.data);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to fetch orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setError(null);
      setSuccessMessage(null);
      const response = await api.patch(`/pharma/orders/${orderId}/status`, { status: newStatus });
      
      if (newStatus === 'confirmed') {
        setSuccessMessage('Order confirmed successfully');
      } else if (newStatus === 'cancelled') {
        setSuccessMessage('Order cancelled successfully');
      }
      
      fetchOrders(); // Refresh orders after update
    } catch (err) {
      console.error('Error updating order status:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update order status. Please try again.';
      setError(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brandCyan"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    );
  }

  if (user?.role === "pharma") {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Medical Store Orders</h1>
        
        {/* Search and Sort Controls */}
        <div className="mb-6 flex items-center">
          <input
            type="text"
            placeholder="Search by medical store, product name, or batch number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition w-full max-w-lg"
          />
          <button
            onClick={() => setSortOrder(prev => prev === "normal" ? "a-z" : "normal")}
            className="ml-2 px-5 py-2 rounded-md font-semibold text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            style={{ minWidth: 60 }}
          >
            A-Z
          </button>
        </div>

        {/* Total Orders Count */}
        <div className="mb-4 font-semibold text-lg">
          Total Orders: {filteredOrders.length}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {successMessage}
          </div>
        )}

        {loading ? (
          <div className="text-center p-4">Loading...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No orders found
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredOrders.map((order) => (
              <div key={order._id} className="bg-white shadow-md rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-lg font-semibold">Order #{order.orderNumber}</h2>
                    <p className="text-gray-600">
                      From: {order.medicalStore.companyName}
                    </p>
                    <p className="text-gray-600">
                      Contact: {order.medicalStore.contactNumber}
                    </p>
                    <p className="text-gray-600">
                      Address: {formatAddress(order.medicalStore.address)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">
                      Total: ₹{order.totalAmount}
                    </p>
                    <p className="text-sm text-gray-500">
                      Due: ₹{order.dueAmount}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Order Items:</h3>
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                        <div>
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-sm text-gray-600">
                            Batch: {item.product.batchNumber} | 
                            Expiry: {new Date(item.product.expiryDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">Qty: {item.quantity}</p>
                          <p className="text-sm text-gray-600">₹{item.price} each</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => handleStatusUpdate(order._id, 'confirmed')}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Confirm Order
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(order._id, 'cancelled')}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    Cancel Order
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Prepare data for charts
  const supplierData = {
    labels: Object.keys(stats.supplierDistribution),
    datasets: [
      {
        data: Object.values(stats.supplierDistribution),
        backgroundColor: [
          "#0EA5E9",
          "#0F766E",
          "#10B981",
          "#F59E0B",
          "#EF4444",
        ],
        borderColor: [
          "#0284C7",
          "#0D9488",
          "#059669",
          "#D97706",
          "#DC2626",
        ],
        borderWidth: 1,
      },
    ],
  };

  const inventoryStatusData = {
    labels: ["In Stock", "Low Stock", "Out of Stock"],
    datasets: [
      {
        data: [
          stats.inventoryStatus.inStock,
          stats.inventoryStatus.lowStock,
          stats.inventoryStatus.outOfStock,
        ],
        backgroundColor: ["#10B981", "#F59E0B", "#EF4444"],
        borderColor: ["#059669", "#D97706", "#DC2626"],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-brandDark mb-8">
        Welcome, {user?.companyName}
      </h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-brandDark mb-2">
            Total Products
          </h3>
          <p className="text-3xl font-bold text-brandCyan">
            {stats.totalProducts}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-brandDark mb-2">
            Low Stock Products
          </h3>
          <p className="text-3xl font-bold text-brandLightblue">
            {stats.lowStockProducts}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-brandDark mb-2">
            Expiring Products
          </h3>
          <p className="text-3xl font-bold text-brandBlue">
            {stats.expiringProducts}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-brandDark mb-4">
            Supplier Distribution
          </h3>
          <div className="h-80">
            <Pie
              data={supplierData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
                  },
                },
              }}
            />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-brandDark mb-4">
            Inventory Status
          </h3>
          <div className="h-80">
            <Pie
              data={inventoryStatusData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
                  },
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 