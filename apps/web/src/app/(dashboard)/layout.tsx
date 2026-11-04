"use client";

import DashboardHeader from "@/components/layout/DashboardHeader";
import Sidebar from "@/components/layout/Sidebar";
import ProtectedRoute from "@/lib/protected-route";
import { useAuth } from "@/lib/auth-context";
import { LogOut } from "lucide-react";

function UserMenu() {
  const { user, logout } = useAuth();

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-600 dark:bg-[#1a2d45]">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
          {(user?.name ?? "U")[0].toUpperCase()}
        </div>

        <span className="hidden text-sm font-medium text-slate-700 dark:text-slate-200 sm:inline">
          {user?.name || "Analyst"}
        </span>
      </div>

      <button
        type="button"
        aria-label="Log out"
        onClick={logout}
        className="flex items-center rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:bg-[#1a2d45] dark:text-slate-400 dark:hover:bg-slate-800"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen w-full min-w-0 overflow-x-clip bg-slate-50 dark:bg-[#0a1628]">

        {/* Fixed full-width header */}
        <DashboardHeader
          userMenu={<UserMenu />}
          mobileMenu={(closeMenu) => (
            <Sidebar mobile onNavigate={closeMenu} />
          )}
        />

        {/* Content starts below fixed header */}
        <div className="flex min-h-screen w-full min-w-0 pt-16">

          {/* Fixed desktop sidebar */}
          <Sidebar />

          {/* Scrollable page content */}
          <main className="min-h-[calc(100vh-4rem)] min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6 lg:ml-64 lg:p-8">
            {children}
          </main>

        </div>
      </div>
    </ProtectedRoute>
  );
}
