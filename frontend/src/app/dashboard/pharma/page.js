"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function PharmaPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("normal"); // normal, a-z
  const [selectedQuantities, setSelectedQuantities] = useState({});
  const [pendingOrders, setPendingOrders] = useState([]);

  useEffect(() => {
    if (!user) return;
    if (user.role === "medical_store") {
      fetchProducts();
    } else if (user.role === "pharma") {
      fetchProducts();
      fetchPendingOrders();
    } else {
      router.push("/dashboard");
    }
  }, [user]);

  useEffect(() => {
    let result = [...products];
    if (searchTerm) {
      result = result.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.pharmaCompany?.companyName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (sortOrder === "a-z") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }
    setFilteredProducts(result);
  }, [searchTerm, sortOrder, products]);

  const fetchProducts = async () => {
    try {
      const response = await api.get("/products");
      setProducts(response.data);
      setFilteredProducts(response.data);
    } catch (err) {
      setError("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingOrders = async () => {
    try {
      const response = await api.get("/orders");
      setPendingOrders(response.data.filter(order => order.status === 'pending'));
    } catch (err) {
      setError("Failed to fetch pending orders");
    }
  };

  const handleQuantityChange = (productId, quantity) => {
    setSelectedQuantities(prev => ({
      ...prev,
      [productId]: Math.min(Math.max(1, parseInt(quantity) || 0), products.find(p => p._id === productId)?.quantity || 0)
    }));
  };

  const handleOrder = async (product) => {
    try {
      setError(null);
      setSuccessMessage(null);
      const quantity = selectedQuantities[product._id] || 1;

      // Create order request
      const response = await api.post("/orders", {
        pharmaCompany: product.pharmaCompany._id,
        items: [{
          product: product._id,
          quantity: quantity
        }]
      });

      // Clear the selected quantity
      setSelectedQuantities(prev => {
        const newQuantities = { ...prev };
        delete newQuantities[product._id];
        return newQuantities;
      });

      // Show success message
      setSuccessMessage(`Order request for ${product.name} sent successfully!`);
      
      // Refresh products to update quantities
      fetchProducts();

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err) {
      console.error('Order creation error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        product: product
      });
      setError(err.response?.data?.message || "Failed to send order request. Please try again.");
    }
  };

  const toggleSort = () => {
    setSortOrder(prev => prev === "normal" ? "a-z" : "normal");
  };

  const handleOrderStatusUpdate = async (orderId, status) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      await fetchPendingOrders();
    } catch (err) {
      setError("Failed to update order status");
    }
  };

  if (loading) return <div className="text-center p-4">Loading...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        {user.role === "pharma" ? "Pharma Dashboard" : "Available Products from Pharma Companies"}
      </h1>

      {/* Pending Orders Section - Only for Pharma Users */}
      {user.role === "pharma" && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Pending Orders</h2>
          {pendingOrders.length === 0 ? (
            <p className="text-gray-500">No pending orders</p>
          ) : (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medical Store</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingOrders.map((order) => (
                    <tr key={order._id}>
                      <td className="px-6 py-4 whitespace-nowrap">{order.orderNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{order.medicalStore.companyName}</td>
                      <td className="px-6 py-4">
                        {order.items.map((item, index) => (
                          <div key={index} className="text-sm">
                            {item.product.name} - Qty: {item.quantity}
                          </div>
                        ))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">₹{order.totalAmount}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleOrderStatusUpdate(order._id, 'confirmed')}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => handleOrderStatusUpdate(order._id, 'cancelled')}
                            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                          >
                            Cancel
                          </button>
        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
        </div>
          )}
        </div>
      )}

      {/* Search and Sort Controls */}
      <div className="mb-6 flex items-center">
        <input
          type="text"
          placeholder="Search products by name, batch number, or pharma company..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition w-full max-w-lg"
        />
        <button
          onClick={toggleSort}
          className="ml-2 px-5 py-2 rounded-md font-semibold text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          style={{ minWidth: 60 }}
        >
          A-Z
        </button>
      </div>

      {/* Total Products Count */}
      <div className="mb-4 font-semibold text-lg">Total Products: {filteredProducts.length}</div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price per Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pharma Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProducts.map((product) => (
              <tr key={product._id}>
                <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{product.batchNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(product.expiryDate).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">₹{product.sellingPrice}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    product.quantity === 0 
                      ? 'bg-red-100 text-red-800'
                      : product.quantity <= 10
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {product.quantity}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    min="1"
                    max={product.quantity}
                    value={selectedQuantities[product._id] || 1}
                    onChange={(e) => handleQuantityChange(product._id, e.target.value)}
                    disabled={product.quantity === 0}
                    className="w-20 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{product.pharmaCompany?.companyName || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleOrder(product)}
                    disabled={product.quantity === 0}
                    className={`px-4 py-2 rounded ${
                      product.quantity === 0
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {product.quantity === 0 ? 'Out of Stock' : 'Order'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 