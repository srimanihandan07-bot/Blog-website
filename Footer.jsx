import { Link } from 'react-router-dom';
import { BookOpen, Twitter, Github, Linkedin, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl text-white">
              <BookOpen className="h-6 w-6 text-indigo-400" />
              <span>DesignArena<span className="text-indigo-400">Blog</span></span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              A premium space where high-quality technical writing, modern design, and highly engaging conversations merge together.
            </p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition-colors"><Twitter className="h-5 w-5" /></a>
              <a href="#" className="hover:text-white transition-colors"><Github className="h-5 w-5" /></a>
              <a href="#" className="hover:text-white transition-colors"><Linkedin className="h-5 w-5" /></a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Categories</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/?category=Technology" className="hover:text-white transition-colors">Technology</Link></li>
              <li><Link to="/?category=Development" className="hover:text-white transition-colors">Development</Link></li>
              <li><Link to="/?category=Design" className="hover:text-white transition-colors">Design</Link></li>
              <li><Link to="/?category=Tutorials" className="hover:text-white transition-colors">Tutorials</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Explore</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-white transition-colors">All Articles</Link></li>
              <li><Link to="/dashboard" className="hover:text-white transition-colors">User Dashboard</Link></li>
              <li><Link to="/profile" className="hover:text-white transition-colors">Author Profiles</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">Newsletter</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Newsletter</h3>
            <p className="text-sm mb-4 leading-relaxed">Stay up to date with the latest stories, tutorials, and premium design articles.</p>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const email = e.target.email.value;
              if (!email) return;
              try {
                await fetch('/api/newsletter', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email })
                });
                alert('Thank you for subscribing!');
                e.target.reset();
              } catch (err) {
                console.error(err);
              }
            }} className="flex gap-2">
              <input
                type="email"
                name="email"
                required
                placeholder="Enter your email"
                className="bg-slate-800 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1 min-w-0"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <p>© {new Date().getFullYear()} DesignArena Blog. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="h-4 w-4 text-rose-500 fill-rose-500" /> for the Design Arena Community
          </p>
        </div>
      </div>
    </footer>
  );
}
