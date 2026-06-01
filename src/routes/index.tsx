import React from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isAdmin } from "../lib/permissions";
import PostFeed from "../features/muro/components/PostFeed";
import Classroom from "../features/classroom/components/Classroom";
import Profile from "../features/profile/components/Profile";
import AdminDashboard from "../features/admin/AdminDashboard";
import Landing from "../features/landing/landing";
import Login from "../features/auth/components/Login";
import Register from "../features/auth/components/Register";

function AdminRoute() {
  const { user } = useAuth();
  if (!isAdmin(user?.role)) {
    setTimeout(() => alert("No tienes permisos para acceder al panel de administración."), 0);
    return <Navigate to="/muro" replace />;
  }
  return <AdminDashboard />;
}

function LandingPage() {
  const navigate = useNavigate();
  return (
    <Landing
      onViewChange={(v) => {
        if (v === "login") navigate("/login");
        else if (v === "register") navigate("/register");
      }}
    />
  );
}

function LoginPage() {
  const navigate = useNavigate();
  return <Login onGoToRegister={() => navigate("/register")} />;
}

function RegisterPage() {
  const navigate = useNavigate();
  return <Register onGoToLogin={() => navigate("/login")} />;
}

function ExplorePage() {
  return (
    <div className="text-center py-20">
      <h2 className="text-2xl font-bold text-[#131b2e]">Explorando comunidades...</h2>
      <p className="text-[#464555] mt-2 italic">Feature coming soon!</p>
    </div>
  );
}

export interface AppRoute {
  path: string;
  element: React.ReactNode;
}

export const authRoutes: AppRoute[] = [
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
];

export const appRoutes: AppRoute[] = [
  { path: "/muro", element: <PostFeed /> },
  { path: "/classroom", element: <Classroom /> },
  { path: "/explore", element: <ExplorePage /> },
  { path: "/profile", element: <Profile /> },
  { path: "/admin", element: <AdminRoute /> },
];
