import React from "react";
import logo from "../../assets/logo.png";
import { MessageSquare, School, User, Bell, LayoutGrid, LogOut, Shield } from "lucide-react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { isAdmin } from "../../lib/permissions";

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

const desktopNav = [
  { path: "/muro", label: "Comunidad", icon: <MessageSquare size={20} /> },
  { path: "/classroom", label: "Aula Virtual", icon: <School size={20} /> },
  { path: "/profile", label: "Mi Perfil", icon: <User size={20} /> },
];

const mobileNav = [
  { path: "/muro", label: "Home", icon: MessageSquare },
  { path: "/classroom", label: "Classroom", icon: School },
  { path: "/profile", label: "Perfil", icon: User },
];

export default function Layout({ children, onLogout }: LayoutProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const adminNav = isAdmin(user?.role) ? [{ path: "/admin", label: "Admin", icon: <Shield size={20} /> }] : [];
  const mobileAdminNav = isAdmin(user?.role) ? [{ path: "/admin", label: "Admin", icon: Shield }] : [];
  const isProfileView = location.pathname === "/profile";

  return (
    <div className="flex min-h-screen bg-brand-background text-brand-text-main overflow-hidden">
      {/* Sidebar - Persistent on Desktop */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-brand-border flex-col p-8 space-y-10 flex-shrink-0">
        <div className="group cursor-pointer flex items-center space-x-3" onClick={() => navigate("/muro")}>
          <img src={logo} alt="Logo" className="w-10 h-10 object-contain transition-transform group-hover:scale-110" />
          <span className="font-black text-xl tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">Ecom Club</span>
        </div>

        <nav className="flex-1 space-y-3">
          {[...desktopNav, ...adminNav].map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-4 p-4 rounded-2xl font-semibold transition-all ${
                  isActive
                    ? "bg-indigo-50 text-brand-primary shadow-sm"
                    : "text-brand-text-muted hover:bg-slate-50 hover:text-brand-text-main"
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="pt-8 border-t border-brand-border">
          <div className="flex items-center gap-2 mb-6">
            <div
              className="flex-1 flex items-center space-x-4 p-2 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer min-w-0"
              onClick={() => navigate("/profile")}
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 border-2 border-white shadow-md overflow-hidden flex-shrink-0">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
                    {user?.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">{user?.name ?? "Usuario"}</p>
                <p className="text-xs text-brand-text-muted font-medium capitalize">{user?.role ?? "member"}</p>
              </div>
            </div>
            <button className="relative p-2.5 rounded-2xl hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors flex-shrink-0">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            </button>
          </div>
          <button
            onClick={onLogout}
            className="w-full py-3 px-4 bg-slate-900 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-black transition-colors"
          >
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header Mobile */}
        <header className="lg:hidden h-16 bg-white border-b border-brand-border px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => navigate("/muro")}>
            <img
              src={logo}
              alt="Logo"
              className="w-8 h-8 object-contain"
            />
            <span className="font-black text-lg tracking-tight text-slate-900">Ecom Club</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-brand-text-muted hover:bg-slate-100 rounded-full">
              <Bell size={20} />
            </button>
            <button className="p-2 text-brand-text-muted hover:bg-slate-100 rounded-full">
              <LayoutGrid size={20} />
            </button>
            <button
              onClick={onLogout}
              className="p-2 text-red-400 hover:bg-red-50 rounded-full transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto w-full pb-24 lg:pb-0">
          <div className={`max-w-7xl mx-auto space-y-8 ${isProfileView ? "p-0 md:p-8" : "p-4 md:p-8"}`}>
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-brand-border px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] z-50 shadow-[0_-4px_24px_rgba(15,23,42,0.06)]">
        <div className="flex items-end justify-around max-w-lg mx-auto">
          {[...mobileNav, ...mobileAdminNav].map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 min-w-[4.5rem] py-1 transition-all ${
                    isActive ? "text-violet-600" : "text-slate-400"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`flex items-center justify-center rounded-full transition-all ${
                        isActive
                          ? "w-12 h-12 bg-violet-500 text-white shadow-lg shadow-violet-200/70 -mt-3"
                          : "w-10 h-10"
                      }`}
                    >
                      <Icon size={isActive ? 22 : 20} strokeWidth={isActive ? 2.5 : 2} />
                    </span>
                    <span className={`text-[10px] font-bold ${isActive ? "text-violet-600" : "text-slate-400"}`}>
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
