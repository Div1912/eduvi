import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "@/contexts/WalletContext";
import { AuthProvider } from "@/contexts/AuthContext";
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
              <Route path="/" element={<Index />} />
              <Route path="/verify" element={<Verify />} />
              <Route path="/login" element={<Login />} />
              <Route path="/role-select" element={<RoleSelect />} />
              <Route path="/dashboard" element={<RoleSelect />} />
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/student/credentials" element={<StudentCredentials />} />
              <Route path="/student/resume-builder" element={<ResumeBuilder />} />
              <Route path="/issuer/dashboard" element={<IssuerDashboard />} />
              <Route path="/issuer/issue" element={<IssueCredential />} />
              <Route path="/verifier/dashboard" element={<VerifierDashboard />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/institutions" element={<AdminInstitutions />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </WalletProvider>
  </QueryClientProvider>
);

export default App;