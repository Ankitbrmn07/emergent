import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, Home, LayoutDashboard } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full text-center space-y-6 bg-slate-900/60 border border-slate-800 p-8 rounded-2xl shadow-2xl backdrop-blur-md">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400">
          <Bot className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 text-xs font-semibold bg-purple-500/10 border border-purple-500/30 text-purple-300 rounded-full">
            404 - Page Not Found
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Lost in Hyper-Space?
          </h1>
          <p className="text-sm text-slate-400">
            The page or route you are looking for does not exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white text-xs font-medium flex items-center justify-center space-x-2 transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Go to Homepage</span>
          </Link>

          <Link
            to="/dashboard"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-medium shadow-lg shadow-purple-500/25 flex items-center justify-center space-x-2 transition-all"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Go to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
