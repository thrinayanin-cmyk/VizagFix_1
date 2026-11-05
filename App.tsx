import React, { useState } from 'react';
import { UserProfile, Complaint, ComplaintStatus } from './types';
import {
  getUser,
  saveUser,
  getComplaints,
  addComplaint as persistAddComplaint,
  updateComplaintStatus as persistUpdateStatus,
} from './services/storage';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { FileComplaint } from './components/FileComplaint';
import { IssueProgress } from './components/IssueProgress';
import { ComplaintHistory } from './components/ComplaintHistory';
import { UserProfileView } from './components/UserProfileView';
import { AuthView } from './components/AuthView';
import { CivicChatbot } from './components/CivicChatbot';
import { ShieldCheck, PhoneCall } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getUser());
  const [complaints, setComplaints] = useState<Complaint[]>(() => getComplaints());
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | undefined>(undefined);
  const [isChatbotOpen, setIsChatbotOpen] = useState<boolean>(false);

  // Sync state changes with storage
  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    saveUser(user);
    setCurrentTab('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    saveUser(null);
    setSelectedComplaintId(undefined);
  };

  const handleUpdateUser = (updated: UserProfile) => {
    setCurrentUser(updated);
    saveUser(updated);
  };

  const handleAddComplaint = (newComplaint: Complaint) => {
    persistAddComplaint(newComplaint);
    setComplaints(getComplaints());
  };

  const handleUpdateStatus = (id: string, status: ComplaintStatus, note?: string) => {
    const updated = persistUpdateStatus(id, status, note);
    setComplaints(updated);
  };

  const handleNavigate = (tab: string, complaintId?: string) => {
    if (complaintId) {
      setSelectedComplaintId(complaintId);
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeComplaintsCount = complaints.filter((c) => c.status !== 'solved').length;

  // STRICT REQUIREMENT: Only after they login show the full web!
  // If not logged in, show ONLY the dedicated Auth page (Login for registered users / Sign Up for new users).
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-blue-50/40 text-slate-800 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
        {/* Top Civic Notice Banner */}
        <div className="bg-[#081f4a] text-white text-[11px] py-2 px-4 text-center font-medium border-b border-blue-950 flex items-center justify-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-[#38bdf8]" />
          <span>
            Greater Visakhapatnam Municipal Corporation (GVMC) &bull; Citizen Redressal Portal
          </span>
        </div>

        {/* Dedicated Login / Sign Up Screen */}
        <main className="flex-1 flex items-center justify-center py-6 px-4">
          <AuthView onLoginSuccess={handleLoginSuccess} />
        </main>

        {/* Minimal Footer for Auth Screen */}
        <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white/60">
          <div className="flex items-center justify-center gap-2">
            <img
              src="/assets/aistudio/VizagFix_logo_4a1b0b98.jpeg"
              alt="VizagFix"
              className="h-5 w-auto object-contain rounded"
            />
            <span>VizagFix &copy; 2026 GVMC Citizen Services</span>
          </div>
        </footer>

        {/* Civic Assistant Chatbot */}
        <CivicChatbot
          isOpen={isChatbotOpen}
          onToggle={() => setIsChatbotOpen(!isChatbotOpen)}
        />
      </div>
    );
  }

  // Once authenticated, show the FULL web experience!
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Banner Notice: Professional & Informative */}
      <div className="bg-[#081f4a] text-white text-[11px] py-1.5 px-4 text-center font-medium border-b border-blue-950 flex items-center justify-center gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-[#38bdf8]" />
        <span>
          VizagFix Public Civic Service Portal &bull; Real-Time Ward Redressal &amp; Photo Audit
        </span>
      </div>

      {/* Main Navbar with Official VizagFix Logo */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => handleNavigate(tab)}
        currentUser={currentUser}
        onLogout={handleLogout}
        activeComplaintsCount={activeComplaintsCount}
        onOpenChatbot={() => setIsChatbotOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && (
          <Dashboard
            currentUser={currentUser}
            complaints={complaints}
            onNavigate={handleNavigate}
            onOpenChatbot={() => setIsChatbotOpen(true)}
          />
        )}

        {currentTab === 'file_complaint' && (
          <FileComplaint
            currentUser={currentUser}
            onSubmitSuccess={handleAddComplaint}
            onTrackComplaint={(id) => handleNavigate('track_progress', id)}
          />
        )}

        {currentTab === 'track_progress' && (
          <IssueProgress
            complaints={complaints}
            selectedComplaintId={selectedComplaintId}
            onSelectComplaint={(id) => setSelectedComplaintId(id)}
            onUpdateStatus={handleUpdateStatus}
            onFileNewComplaint={() => handleNavigate('file_complaint')}
          />
        )}

        {currentTab === 'history' && (
          <ComplaintHistory
            complaints={complaints}
            onTrackComplaint={(id) => handleNavigate('track_progress', id)}
            onFileNewComplaint={() => handleNavigate('file_complaint')}
          />
        )}

        {currentTab === 'profile' && (
          <UserProfileView
            user={currentUser}
            complaints={complaints}
            onUpdateUser={handleUpdateUser}
            onFileComplaintClick={() => handleNavigate('file_complaint')}
          />
        )}
      </main>

      {/* Professional Civic Footer with VizagFix Logo */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/VizagFix_logo_4a1b0b98.jpeg"
              alt="VizagFix Logo"
              className="h-9 w-auto object-contain rounded-xl border border-slate-200 bg-white p-0.5 shadow-2xs"
            />
            <div>
              <div className="font-extrabold text-[#0b2b64] text-sm tracking-tight">
                Vizag<span className="text-[#1d6ee5]">Fix</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                GVMC Public Grievance Redressal Cell
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-semibold text-slate-600">
            <button
              onClick={() => handleNavigate('dashboard')}
              className="hover:text-[#0b2b64] transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => handleNavigate('file_complaint')}
              className="hover:text-[#0b2b64] transition-colors"
            >
              File a Complaint
            </button>
            <button
              onClick={() => handleNavigate('track_progress')}
              className="hover:text-[#0b2b64] transition-colors"
            >
              Track Progress
            </button>
            <button
              onClick={() => handleNavigate('history')}
              className="hover:text-[#0b2b64] transition-colors"
            >
              Complaint History
            </button>
            <button
              onClick={() => handleNavigate('profile')}
              className="hover:text-[#0b2b64] transition-colors"
            >
              My Profile
            </button>
          </div>

          <div className="flex items-center gap-2 text-slate-600 font-medium bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <PhoneCall className="w-3.5 h-3.5 text-[#1d6ee5]" />
            <span>GVMC Helpline: <b>1800-425-0005</b> (Toll Free)</span>
          </div>
        </div>
      </footer>

      {/* Civic Assistant Chatbot */}
      <CivicChatbot
        isOpen={isChatbotOpen}
        onToggle={() => setIsChatbotOpen(!isChatbotOpen)}
        onNavigateToTab={(tab) => handleNavigate(tab)}
      />
    </div>
  );
}
