import { Link } from 'react-router-dom';
import { BookOpen, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-slate-50/50 px-4 text-center space-y-6">
      <div className="bg-indigo-50 p-4 rounded-3xl text-indigo-600 animate-bounce">
        <BookOpen className="h-12 w-12" />
      </div>
      <h1 className="text-6xl sm:text-8xl font-black text-slate-900 tracking-tight">404</h1>
      <h2 className="text-2xl font-bold text-slate-800">Page Not Found</h2>
      <p className="text-slate-400 font-medium max-w-md mx-auto leading-relaxed">
        Oops! The article or page you are looking for does not exist, or has been removed. Let's get you back on track!
      </p>
      <Link
        to="/"
        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-indigo-100 flex items-center gap-2 transition-all cursor-pointer"
      >
        <Home className="h-4.5 w-4.5" />
        <span>Back to Home</span>
      </Link>
    </div>
  );
}
