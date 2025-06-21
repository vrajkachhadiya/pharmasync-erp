"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";

export default function NewOrderPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get("/api/products");
      setProducts(response.data);
    } catch (err) {
      setError("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (productId, quantity) => {
    const updatedProducts = selectedProducts.map(p => 
      p.product === productId ? { ...p, quantity: parseInt(quantity) || 0 } : p
    );
    setSelectedProducts(updatedProducts);
  };

  const handleProductSelect = (product) => {
    if (!selectedProducts.find(p => p.product === product._id)) {
      setSelectedProducts([...selectedProducts, {
        product: product._id,
        quantity: 1,
        price: product.sellingPrice
      }]);
    }
  };

  const handleRemoveProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter(p => p.product !== productId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedProducts.length === 0) {
        setError("Please select at least one product");
        return;
      }

      await axios.post("/api/orders", {
        pharmaCompany: products.find(p => 
          selectedProducts.some(sp => sp.product === p._id)
        ).pharmaCompany,
        items: selectedProducts
      });

      router.push("/dashboard/orders");
    } catch (err) {
      setError("Failed to create order");
    }
  };

  if (loading) return <div className="text-center p-4">Loading...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Place New Order</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Available Products</h2>
          <div className="space-y-4">
            {products.map((product) => (
              <div key={product._id} className="flex justify-between items-center p-2 border rounded">
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-gray-600">₹{product.sellingPrice} per unit</p>
                  <p className="text-sm text-gray-600">Stock: {product.quantity}</p>
                </div>
                <button
                  onClick={() => handleProductSelect(product)}
                  disabled={selectedProducts.find(p => p.product === product._id)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Add to Order
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
          {selectedProducts.length === 0 ? (
            <p className="text-gray-500">No products selected</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {selectedProducts.map((item) => {
                const product = products.find(p => p._id === item.product);
                return (
                  <div key={item.product} className="flex justify-between items-center p-2 border rounded">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-600">₹{product.sellingPrice} per unit</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="1"
                        max={product.quantity}
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(item.product, e.target.value)}
                        className="w-20 px-2 py-1 border rounded"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(item.product)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
              <div className="mt-4 pt-4 border-t">
                <p className="text-lg font-semibold">
                  Total: ₹
                  {selectedProducts.reduce((total, item) => {
                    const product = products.find(p => p._id === item.product);
                    return total + (product.sellingPrice * item.quantity);
                  }, 0)}
                </p>
              </div>
              <button
                type="submit"
                className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
              >
                Place Order
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
} 