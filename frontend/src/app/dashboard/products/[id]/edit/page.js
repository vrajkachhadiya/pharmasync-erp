"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";

export default function EditProductPage({ params }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    batchNumber: "",
    expiryDate: "",
    manufacturer: "",
    sellingPrice: "",
    quantity: "",
    category: "",
    description: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchProduct();
  }, []);

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/products/${params.id}`);
      const product = response.data;
      setForm({
        name: product.name,
        batchNumber: product.batchNumber,
        expiryDate: product.expiryDate.split('T')[0], // Format date for input
        manufacturer: product.manufacturer,
        sellingPrice: product.sellingPrice,
        quantity: product.quantity,
        category: product.category,
        description: product.description || "",
      });
    } catch (err) {
      setError("Failed to fetch product details");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await api.put(`/products/${params.id}`, {
        ...form,
        sellingPrice: Number(form.sellingPrice),
        quantity: Number(form.quantity),
      });
      setSuccess("Product updated successfully!");
      setTimeout(() => router.push("/dashboard/products"), 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center p-4">Loading...</div>;
  if (error && !form.name) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Product</h1>
      <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 rounded-lg shadow-md">
        <div>
          <label className="block text-sm font-medium mb-1">Product Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="input-field"
            placeholder="Enter product name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Batch Number</label>
          <input
            type="text"
            name="batchNumber"
            value={form.batchNumber}
            onChange={handleChange}
            required
            className="input-field"
            placeholder="Enter batch number"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Expiry Date</label>
          <input
            type="date"
            name="expiryDate"
            value={form.expiryDate}
            onChange={handleChange}
            required
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Manufacturer</label>
          <input
            type="text"
            name="manufacturer"
            value={form.manufacturer}
            onChange={handleChange}
            required
            className="input-field"
            placeholder="Enter manufacturer name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Price per Quantity</label>
          <input
            type="number"
            name="sellingPrice"
            value={form.sellingPrice}
            onChange={handleChange}
            required
            min={0}
            step="0.01"
            className="input-field"
            placeholder="Enter price per quantity"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Quantity</label>
          <input
            type="number"
            name="quantity"
            value={form.quantity}
            onChange={handleChange}
            required
            min={1}
            className="input-field"
            placeholder="Enter quantity"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <input
            type="text"
            name="category"
            value={form.category}
            onChange={handleChange}
            required
            className="input-field"
            placeholder="Enter category (e.g. Tablet, Syrup)"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description (optional)</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="input-field"
            placeholder="Enter product description"
            rows={2}
          />
        </div>
        {error && <div className="bg-red-50 text-red-500 p-2 rounded">{error}</div>}
        {success && <div className="bg-green-50 text-green-600 p-2 rounded">{success}</div>}
        <div className="flex space-x-2">
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Product"}
          </button>
          <button
            type="button"
            className="btn-primary bg-gray-200 text-gray-700 hover:bg-gray-300"
            onClick={() => router.push("/dashboard/products")}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
} 