import React from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { LogOut } from "lucide-react";

interface SidebarItem {
  icon: React.ElementType;
  label?: string;
  name?: string;
  href: string;
}

interface SidebarProps {
  items?: SidebarItem[];
  navigation?: SidebarItem[];
  role?: string;
}

export function Sidebar({ items, navigation, role }: SidebarProps) {
  const logout = useAuthStore((state) => state.logout);
  const navItems = items || navigation || [];

  return (
    <div className="flex h-screen w-64 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center px-6 border-b border-slate-200">
        <span className="text-lg font-bold text-primary-600">
          School ERP{role ? ` — ${role}` : ''}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium",
                  isActive
                    ? "bg-primary-50 text-primary-700"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                )
              }
            >
              <item.icon
                className={cn("mr-3 h-5 w-5 flex-shrink-0", "text-slate-400 group-hover:text-slate-500")}
                aria-hidden="true"
              />
              {item.label || item.name}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="border-t border-slate-200 p-4">
        <button
          onClick={logout}
          className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
        >
          <LogOut className="mr-3 h-5 w-5 text-slate-400" />
          Logout
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
