"use client";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-brandWhite">
      <nav className="bg-brandDark shadow-md p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo Left */}
          <div className="flex-shrink-0">
            <h1 className="text-3xl font-bold text-brandWhite">PharmaSync</h1>
          </div>
          {/* Centered Nav Buttons */}
          <div className="flex-1 flex justify-center">
            {user?.role === "pharma" && (
              <div className="flex space-x-6">
                <Link href="/dashboard" className="text-brandCyan hover:text-brandLightblue">Home</Link>
                <Link href="/dashboard/medical-store" className="text-brandCyan hover:text-brandLightblue">Medicals</Link>
                <Link href="/dashboard/products" className="text-brandCyan hover:text-brandLightblue">Products</Link>
                <Link href="/dashboard/orders" className="text-brandCyan hover:text-brandLightblue">Invoice</Link>
                <Link href="/dashboard/profile" className="text-brandCyan hover:text-brandLightblue">Profile</Link>
              </div>
            )}
            {user?.role === "medical_store" && (
              <div className="flex space-x-6">
                <Link href="/dashboard" className="text-brandCyan hover:text-brandLightblue">Home</Link>
                <Link href="/dashboard/pharma" className="text-brandCyan hover:text-brandLightblue">Pharmas</Link>
                <Link href="/dashboard/products" className="text-brandCyan hover:text-brandLightblue">Products</Link>
                <Link href="/dashboard/orders" className="text-brandCyan hover:text-brandLightblue">Invoice</Link>
                <Link href="/dashboard/profile" className="text-brandCyan hover:text-brandLightblue">Profile</Link>
              </div>
            )}
            {user?.role === "admin" && (
              <div className="flex space-x-6">
                <Link href="/dashboard" className="text-brandCyan hover:text-brandLightblue">Home</Link>
                {pathname === "/dashboard" && (
                  <Link href="/dashboard/admin" className="text-brandCyan hover:text-brandLightblue">Admin Panel</Link>
                )}
              </div>
            )}
          </div>
          {/* Logout Right */}
          <div className="flex-shrink-0">
            <button
              onClick={logout}
              className="btn-primary px-4 py-2 text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="p-6 bg-brandWhite">
        {children}
      </main>
    </div>
  );
} 