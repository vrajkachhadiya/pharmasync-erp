"use client";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-3xl font-bold text-blue-700 mb-4">Welcome to PharmaSync Dashboard</h1>
        <p className="text-lg text-gray-700">You are logged in as: <span className="font-semibold">{user?.role}</span></p>
        <p className="text-lg text-gray-700">Company: <span className="font-semibold">{user?.companyName}</span></p>
      </div>
    </div>
  );
} 