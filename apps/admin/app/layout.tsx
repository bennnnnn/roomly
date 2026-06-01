import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'Roomly Admin',
  description: 'Roomly moderation and management dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="border-b border-neutral-200 bg-white px-6 py-3">
          <div className="flex items-center gap-4">
            <a href="/" className="text-lg font-bold text-accent-500">
              Roomly Admin
            </a>
            <a href="/reports" className="text-sm text-neutral-600 hover:text-neutral-900">
              Reports
            </a>
            <a href="/users" className="text-sm text-neutral-600 hover:text-neutral-900">
              Users
            </a>
            <a href="/listings" className="text-sm text-neutral-600 hover:text-neutral-900">
              Listings
            </a>
          </div>
        </nav>
        <main className="mx-auto max-w-6xl p-6">{children}</main>
      </body>
    </html>
  );
}
