import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Search,
  User,
  LogOut,
  Menu,
  X,
  Sparkles,
  ListVideo,
  Moon,
  Wallet,
  ShoppingBag,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigation = [
    { name: 'Home', href: '/', icon: Sparkles },
    { name: 'Search', href: '/search', icon: Search },
    { name: 'Mood Matcher', href: '/mood', icon: Moon },
  ];

  if (user) {
    navigation.push({ name: 'My List', href: '/my-list', icon: ListVideo });
    navigation.push({ name: 'Shop', href: '/shop', icon: Wallet });
    navigation.push({ name: 'Inventory', href: '/inventory', icon: ShoppingBag });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center transform group-hover:rotate-6 transition-transform">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text hidden sm:block">
                MyAnimeMind
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-indigo-500/20 text-indigo-400'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3">
                  <Link
                    to={`/profile/${user.username}`}
                    className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">{user.display_name || user.username}</span>
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-indigo-500/20 rounded-full">
                      <Wallet className="w-3 h-3 text-indigo-400" />
                      <span className="text-xs text-indigo-400 font-medium">{user.tokens}</span>
                    </div>
                  </Link>
                  <Link
                    to={`/profile/${user.username}`}
                    className="sm:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
                  >
                    <User className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={signOut}
                    className="p-2 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    title="Sign out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="btn btn-ghost"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="btn btn-primary"
                  >
                    Sign Up
                  </Link>
                </div>
              )}

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50">
            <nav className="px-4 py-3 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-500/20 text-indigo-400'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 pt-16">{children}</main>

      <footer className="bg-slate-900 border-t border-slate-800 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold text-slate-100">MyAnimeMind</span>
              </div>
              <p className="text-slate-400 text-sm">
                Track your anime journey, discover new favorites, and connect with the community.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-200 mb-3">Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="text-slate-400 hover:text-indigo-400 transition-colors">Home</Link></li>
                <li><Link to="/search" className="text-slate-400 hover:text-indigo-400 transition-colors">Search</Link></li>
                <li><a href="https://anilist.co" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-indigo-400 transition-colors">AniList</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-200 mb-3">Attribution</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Data provided by{' '}
                <a href="https://anilist.co" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">
                  AniList
                </a>
              </p>
              <p className="text-slate-500 text-xs mt-3 leading-relaxed">
                All anime images and related media are the property of their respective copyright holders.
                This site is for informational and tracking purposes only.
              </p>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <p className="text-slate-500 text-sm">
              &copy; {new Date().getFullYear()} MyAnimeMind. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
