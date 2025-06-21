"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteProfile = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.delete(`/users/${user._id}`);
      logout();
      router.push("/");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete profile");
      setShowDeleteConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Profile Details</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-600">Role</label>
          <p className="mt-1 text-lg capitalize">{user.role.replace('_', ' ')}</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-600">Company Name</label>
          <p className="mt-1 text-lg">{user.companyName}</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-600">Email</label>
          <p className="mt-1 text-lg">{user.email}</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-600">Contact Number</label>
          <p className="mt-1 text-lg">{user.contactNumber}</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-600">Address</label>
          <p className="mt-1 text-lg">
            {user.address?.street}, {user.address?.city}, {user.address?.state}, {user.address?.pincode}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded">
            {error}
          </div>
        )}

        <div className="pt-4">
          {showDeleteConfirm ? (
            <div className="bg-red-50 p-4 rounded-lg mb-4">
              <p className="text-red-700 mb-4">Are you sure you want to delete your profile? This action cannot be undone.</p>
              <div className="flex space-x-4">
                <button
                  onClick={handleDeleteProfile}
                  disabled={loading}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? "Deleting..." : "Yes, Delete My Profile"}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleDeleteProfile}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Delete Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 