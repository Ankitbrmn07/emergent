import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { GroqKeyModal } from '../modals/GroqKeyModal';

export const AppLayout: React.FC = () => {
  const [groqModalOpen, setGroqModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleNewAgent = () => {
    navigate('/agents?action=create');
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#0B0F17] flex flex-col text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Navbar onOpenGroqModal={() => setGroqModalOpen(true)} />
      <div className="flex flex-1">
        <Sidebar onNewAgentClick={handleNewAgent} />
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
      <GroqKeyModal isOpen={groqModalOpen} onClose={() => setGroqModalOpen(false)} />
    </div>
  );
};
