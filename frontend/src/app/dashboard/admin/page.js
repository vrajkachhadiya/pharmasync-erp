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
import Link from "next/link";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // userId for which action is in progress
  const [search, setSearch] = useState("");
  const [sortAZ, setSortAZ] = useState(false);
  const [originalUsers, setOriginalUsers] = useState([]);

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/dashboard");
      return;
    }
    if (user) fetchUsers();
  }, [user]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get("/users");
      const filtered = response.data.filter(u => u.role !== "admin");
      setUsers(filtered);
      setOriginalUsers(filtered);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockAllow = async (userId, isActive) => {
    setActionLoading(userId);
    try {
      await api.put(`/users/${userId}`, { isActive: !isActive });
      await fetchUsers();
    } catch (error) {
      alert("Failed to update user status");
    } finally {
      setActionLoading(null);
    }
  };

  // Filter users by search
  let filteredUsers = users.filter(u => {
    const searchLower = search.toLowerCase();
    return (
      (u.companyName && u.companyName.toLowerCase().includes(searchLower)) ||
      (u.email && u.email.toLowerCase().includes(searchLower))
    );
  });

  if (sortAZ) {
    filteredUsers = [...filteredUsers].sort((a, b) => {
      const nameA = (a.companyName || '').toLowerCase();
      const nameB = (b.companyName || '').toLowerCase();
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return 0;
    });
  } else {
    // Restore original order (filtered by search)
    filteredUsers = originalUsers.filter(u => {
      const searchLower = search.toLowerCase();
      return (
        (u.companyName && u.companyName.toLowerCase().includes(searchLower)) ||
        (u.email && u.email.toLowerCase().includes(searchLower))
      );
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brandCyan"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brandDark mb-4">Admin Panel</h1>
      </div>
      <div className="mb-4 flex items-center gap-6">
        <div className="text-lg font-semibold text-brandDark">Total Users: {filteredUsers.length}</div>
        <div className="max-w-md flex gap-2 items-center w-full">
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brandCyan/20 focus:border-brandCyan outline-none transition-all duration-200"
          />
          <button
            onClick={() => setSortAZ((prev) => !prev)}
            className={`px-4 py-2 bg-brandCyan text-white rounded hover:bg-brandLightblue transition-colors whitespace-nowrap ${sortAZ ? 'bg-brandBlue' : ''}`}
            title={sortAZ ? 'Normal Order' : 'Sort A-Z'}
          >
            A-Z
          </button>
        </div>
      </div>
      <div className="overflow-x-auto min-h-[300px]">
        <table className="min-w-full bg-white rounded-lg shadow-md">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Name</th>
              <th className="py-2 px-4 border-b">Email</th>
              <th className="py-2 px-4 border-b">Role</th>
              <th className="py-2 px-4 border-b">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u._id} className="text-center">
                <td className="py-2 px-4 border-b">{u.companyName || '-'}</td>
                <td className="py-2 px-4 border-b">{u.email}</td>
                <td className="py-2 px-4 border-b capitalize">{u.role.replace('_', ' ')}</td>
                <td className="py-2 px-4 border-b">
                  <button
                    className={`px-4 py-1 rounded text-white font-semibold ${u.isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} ${actionLoading === u._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => handleBlockAllow(u._id, u.isActive)}
                    disabled={actionLoading === u._id}
                  >
                    {actionLoading === u._id
                      ? (
                        <span className="flex items-center justify-center">
                          <span className="w-4 h-4 border-2 border-t-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                          Processing...
                        </span>
                      )
                      : u.isActive ? 'Block' : 'Allow'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="text-center text-gray-500 py-8">No users found.</div>
        )}
      </div>
    </div>
  );
} 