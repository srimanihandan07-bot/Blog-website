import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X, BookOpen, LogOut, User, LayoutDashboard, Shield, PlusCircle } from 'lucide-react';

export default function Navbar() {
  const { user, profile, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl text-indigo-600">
              <BookOpen className="h-6 w-6" />
              <span>DesignArena<span className="text-slate-800">Blog</span></span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">Home</Link>
            
            {user ? (
              <>
                <Link to="/create-blog" className="flex items-center gap-1 text-slate-600 hover:text-indigo-600 font-medium transition-colors">
                  <PlusCircle className="h-4 w-4" />
                  <span>Write</span>
                </Link>
                <Link to="/dashboard" className="flex items-center gap-1 text-slate-600 hover:text-indigo-600 font-medium transition-colors">
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                {profile?.role === 'admin' && (
                  <Link to="/admin" className="flex items-center gap-1 text-red-600 hover:text-red-700 font-semibold transition-colors">
                    <Shield className="h-4 w-4" />
                    <span>Admin</span>
                  </Link>
                )}
                <div className="h-4 w-px bg-slate-200"></div>
                <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <img
                    src={profile?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop'}
                    alt={profile?.name || 'Avatar'}
                    className="h-8 w-8 rounded-full object-cover ring-2 ring-indigo-100"
                  />
                  <span className="text-sm font-medium text-slate-700">{profile?.name || 'User'}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-slate-500 hover:text-rose-600 font-medium transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">Sign In</Link>
                <Link
                  to="/login?signup=true"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg transition-colors shadow-sm shadow-indigo-100"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-600 hover:text-indigo-600 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-slate-100 animate-in fade-in slide-in-from-top-5 duration-200">
          <div className="px-2 pt-2 pb-4 space-y-1 sm:px-3">
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
            >
              Home
            </Link>
            
            {user ? (
              <>
                <Link
                  to="/create-blog"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
                >
                  Write Post
                </Link>
                <Link
                  to="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
                >
                  Dashboard
                </Link>
                {profile?.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-semibold text-red-600 hover:bg-red-50"
                  >
                    Admin Panel
                  </Link>
                )}
                <Link
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
                >
                  My Profile
                </Link>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-rose-600 hover:bg-rose-50"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="pt-4 border-t border-slate-100 flex flex-col gap-2 px-3">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="text-center block w-full border border-slate-200 text-slate-700 font-medium py-2 rounded-lg hover:bg-slate-50"
                >
                  Sign In
                </Link>
                <Link
                  to="/login?signup=true"
                  onClick={() => setIsOpen(false)}
                  className="text-center block w-full bg-indigo-600 text-white font-medium py-2 rounded-lg hover:bg-indigo-700"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
