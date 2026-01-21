'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { useSession } from 'next-auth/react';

export default function DashboardPage() {
  const { data: session } = useSession();

  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-12 text-white max-w-2xl w-full">
          <h1 className="text-4xl font-bold mb-4">
            Selamat Datang, Mitra Redigma! 👋
          </h1>
          <p className="text-indigo-100 text-xl mb-6">
            {session?.user?.email || 'Partner'}
          </p>
          <p className="text-indigo-100 text-lg leading-relaxed">
            Platform Dashboard Redigma membantu Anda mengelola data pesanan dari berbagai marketplace dengan mudah dan efisien.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}