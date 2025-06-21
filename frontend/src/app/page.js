"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-brandWhite to-brandLightblue">
      {/* Navigation */}
      <nav className="bg-brandDark shadow-md p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-brandWhite">PharmaSync</h1>
          <div className="space-x-4">
            <Link href="/login" className="text-brandCyan hover:text-brandLightblue">
              Login
            </Link>
            <Link href="/register" className="text-brandCyan hover:text-brandLightblue">
              Register
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-brandDark mb-6">
            Streamline Your Pharmaceutical Business
          </h1>
          <p className="text-xl text-brandBlue mb-8 max-w-3xl mx-auto">
            PharmaSync is a comprehensive ERP solution designed for pharmaceutical wholesalers and medical retailers to manage their inventory and business relationships efficiently.
          </p>
          <div className="space-x-4">
            <Link
              href="/register"
              className="bg-brandCyan text-brandWhite px-6 py-3 rounded-lg hover:bg-brandLightblue transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="bg-brandDark text-brandWhite px-6 py-3 rounded-lg hover:bg-brandBlue transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-brandWhite py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-brandDark text-center mb-12">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-brandDark mb-4">
                Inventory Management
              </h3>
              <p className="text-brandBlue">
                Track your medicine stock, manage batch numbers, and monitor expiry dates efficiently.
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-brandDark mb-4">
                Payment Tracking
              </h3>
              <p className="text-brandBlue">
                Monitor payment statuses in real-time, with clear indicators for paid and unpaid transactions.
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-brandDark mb-4">
                Invoice Management
              </h3>
              <p className="text-brandBlue">
                Generate and manage detailed invoices for all transactions with professional formatting.
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-brandDark mb-4">
                Business Relationships
              </h3>
              <p className="text-brandBlue">
                Connect pharmaceutical wholesalers with medical retailers for seamless business operations.
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-brandDark mb-4">
                Record Keeping
              </h3>
              <p className="text-brandBlue">
                Maintain detailed records of inventory, transactions, and business relationships.
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-brandDark mb-4">
                Financial Reports
              </h3>
              <p className="text-brandBlue">
                Access comprehensive financial reports including payment history and outstanding balances.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-brandDark text-brandWhite py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>© {new Date().getFullYear()} PharmaSync. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
} 