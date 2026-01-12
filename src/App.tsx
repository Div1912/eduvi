import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "@/contexts/WalletContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Verify from "./pages/Verify";
import Login from "./pages/Login";
import RoleSelect from "./pages/RoleSelect";
import StudentDashboard from "./pages/student/Dashboard";
import StudentCredentials from "./pages/student/Credentials";
import ResumeBuilder from "./pages/student/ResumeBuilder";
import IssuerDashboard from "./pages/issuer/Dashboard";
import IssueCredential from "./pages/issuer/IssueCredential";
import VerifierDashboard from "./pages/verifier/Dashboard";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminInstitutions from "./pages/admin/Institutions";
import AdminSettings from "./pages/admin/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <WalletProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/verify" element={<Verify />} />
              <Route path="/login" element={<Login />} />
              <Route path="/role-select" element={<RoleSelect />} />
              <Route path="/dashboard" element={<RoleSelect />} />
              
              {/* Student routes - require student role or allow demo */}
              <Route path="/student/dashboard" element={
                <ProtectedRoute requiredRole="student" allowDemo>
                  <StudentDashboard />
                </ProtectedRoute>
              } />
              <Route path="/student/credentials" element={
                <ProtectedRoute requiredRole="student" allowDemo>
                  <StudentCredentials />
                </ProtectedRoute>
              } />
              <Route path="/student/resume-builder" element={
                <ProtectedRoute requiredRole="student" allowDemo>
                  <ResumeBuilder />
                </ProtectedRoute>
              } />
              
              {/* Issuer routes - require issuer role */}
              <Route path="/issuer/dashboard" element={
                <ProtectedRoute requiredRole="issuer">
                  <IssuerDashboard />
                </ProtectedRoute>
              } />
              <Route path="/issuer/issue" element={
                <ProtectedRoute requiredRole="issuer">
                  <IssueCredential />
                </ProtectedRoute>
              } />
              
              {/* Verifier routes - require verifier role */}
              <Route path="/verifier/dashboard" element={
                <ProtectedRoute requiredRole="verifier">
                  <VerifierDashboard />
                </ProtectedRoute>
              } />
              
              {/* Admin routes - require admin role */}
              <Route path="/admin/dashboard" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminUsers />
                </ProtectedRoute>
              } />
              <Route path="/admin/institutions" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminInstitutions />
                </ProtectedRoute>
              } />
              <Route path="/admin/settings" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminSettings />
                </ProtectedRoute>
              } />
              
              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </WalletProvider>
  </QueryClientProvider>
);

export default App;
