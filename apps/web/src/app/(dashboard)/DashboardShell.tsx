"use client";

import DashboardHeader from "@/components/layout/DashboardHeader";
import Sidebar from "@/components/layout/Sidebar";
import ProtectedRoute from "@/lib/protected-route";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { LogOut } from "lucide-react";

function UserMenu() {
  const { user, logout } = useAuth();

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/dashboard/settings"
        className="flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-1.5 transition hover:bg-neutral-50"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-950 text-xs font-bold text-white">
          {(user?.name ?? "U")[0].toUpperCase()}
        </div>

        <span className="hidden text-sm font-medium text-neutral-800 sm:inline">
          {user?.name || "Analyst"}
        </span>
      </Link>

      <button
        type="button"
        aria-label="Log out"
        onClick={logout}
        className="flex items-center rounded-lg border border-black/10 bg-white p-2 text-neutral-500 transition hover:bg-neutral-50 hover:text-neutral-950"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen w-full min-w-0 overflow-x-clip bg-neutral-50 text-neutral-950">
        <DashboardHeader
          userMenu={<UserMenu />}
          mobileMenu={(closeMenu) => <Sidebar mobile onNavigate={closeMenu} />}
        />
        <div className="flex min-h-screen w-full min-w-0 pt-16">
          <Sidebar />
          <main className="min-h-[calc(100vh-4rem)] min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6 lg:ml-64 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
