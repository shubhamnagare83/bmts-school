import React from "react";
import { useAuthStore } from "@/stores/authStore";
import { getInitials } from "@/lib/utils";
import { Bell } from "lucide-react";

export function Header() {
  const user = useAuthStore((state) => state.user);

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="flex items-center">
        <h2 className="text-xl font-semibold text-slate-800">Dashboard</h2>
      </div>
      <div className="flex items-center space-x-4">
        <button className="relative text-slate-400 hover:text-slate-500">
          <Bell className="h-6 w-6" />
          <span className="absolute right-0 top-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
        </button>
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700">
            {getInitials(user?.name || user?.username || "U")}
          </div>
          <span className="text-sm font-medium text-slate-700">{user?.name || user?.username}</span>
        </div>
      </div>
    </header>
  );
}

export default Header;
