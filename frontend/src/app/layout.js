import './globals.css';
import ClientLayout from './ClientLayout';

export const metadata = {
  title: 'PharmaSync ERP',
  description: 'A comprehensive ERP solution for pharmaceutical companies',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
} 