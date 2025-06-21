"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";

export default function ManageProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("normal"); // normal, a-z
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!user) return;
    if (user.role === "medical_store") {
      fetchPurchasedProducts();
    } else {
      fetchProducts();
    }
  }, [user, pathname]);

  useEffect(() => {
    let result = [...products];
    if (searchTerm) {
      result = result.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.pharmaCompany || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (sortOrder === "a-z") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }
    setFilteredProducts(result);
  }, [searchTerm, sortOrder, products]);

  // For pharma: show their own products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get("/products?own=true");
      setProducts(response.data);
      setFilteredProducts(response.data);
    } catch (err) {
      setError("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  // For medical: show products from confirmed orders
  const fetchPurchasedProducts = async () => {
    try {
      const response = await api.get("/orders");
      // Only confirmed orders
      const confirmedOrders = response.data.filter(order => order.status === "confirmed");
      // Flatten all products from all confirmed orders
      const purchased = [];
      confirmedOrders.forEach(order => {
        order.items.forEach(item => {
          purchased.push({
            _id: item.product._id + "-" + order._id, // unique per order
            name: item.product.name,
            batchNumber: item.product.batchNumber,
            expiryDate: item.product.expiryDate,
            pharmaCompany: order.pharmaCompany?.companyName || "",
            quantity: item.quantity,
            sellingPrice: item.price,
            orderId: order._id
          });
        });
      });
      setProducts(purchased);
      setFilteredProducts(purchased);
    } catch (err) {
      setError("Failed to fetch purchased products");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      await api.delete(`/products/${productId}`);
      setProducts(products.filter(p => p._id !== productId));
    } catch (err) {
      setError("Failed to delete product");
    }
  };

  const toggleSort = () => {
    setSortOrder(prev => prev === "normal" ? "a-z" : "normal");
  };

  if (loading) return <div className="text-center p-4">Loading...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        {user?.role === "medical_store" ? "Purchased Products" : "Manage Products"}
      </h1>
      {user?.role === "medical_store" && (
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
      )}
      {user?.role === "medical_store" && (
        <div className="mb-4 font-semibold text-lg">Total Products: {filteredProducts.length}</div>
      )}
      {user?.role === "pharma" && (
        <>
          <div className="mb-4 font-semibold text-lg">Total Products: {filteredProducts.length}</div>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-4"
            onClick={() => router.push("/dashboard/products/new")}
          >
            Add New Product
          </button>
        </>
      )}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price per Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              {user?.role === "medical_store" && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pharma Company</th>
              )}
              {user?.role === "pharma" && (
                <>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProducts.map((product) => (
              <tr key={product._id}>
                <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{product.batchNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(product.expiryDate).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">₹{product.sellingPrice}</td>
                <td className="px-6 py-4 whitespace-nowrap">{product.quantity}</td>
                {user?.role === "medical_store" && (
                  <td className="px-6 py-4 whitespace-nowrap">{product.pharmaCompany}</td>
                )}
                {user?.role === "pharma" && (
                  <>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.quantity === 0 ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Sold Out
                        </span>
                      ) : product.quantity <= 10 ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Low Stock
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap space-x-2">
                      <button
                        onClick={() => router.push(`/dashboard/products/${product._id}/edit`)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}