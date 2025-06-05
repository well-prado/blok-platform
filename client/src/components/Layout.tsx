import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, User, LogOut, Menu, X, Plus, Home, Briefcase } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../stores/auth';
import { generateAvatarUrl } from '../lib/utils';

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Workflows', href: '/workflows', icon: Briefcase },
  ];

  const userNavigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Profile', href: '/profile' },
  ];

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and main navigation */}
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">B</span>
                  </div>
                  <span className="ml-2 text-xl font-bold text-secondary-900">
                    Blok Community
                  </span>
                </div>
              </Link>

              {/* Desktop navigation */}
              <div className="hidden md:ml-8 md:flex md:space-x-8">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors ${
                        isActive
                          ? 'text-primary-600 border-b-2 border-primary-600'
                          : 'text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                      }`}
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Search bar */}
            <div className="flex-1 flex justify-center px-4 md:px-6 lg:px-8 max-w-md mx-auto">
              <div className="w-full">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-secondary-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search workflows..."
                    className="block w-full pl-10 pr-3 py-2 border border-secondary-300 rounded-lg text-sm placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Right side navigation */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  {/* Create workflow button */}
                  <Link
                    to="/workflows/create"
                    className="btn-primary hidden md:inline-flex"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create
                  </Link>

                  {/* User menu */}
                  <div className="relative group">
                    <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-secondary-100 transition-colors">
                      <img
                        src={user?.profile_image_url || generateAvatarUrl(user?.username || '')}
                        alt={user?.username}
                        className="h-8 w-8 rounded-full"
                      />
                      <span className="hidden md:block text-sm font-medium text-secondary-700">
                        {user?.username}
                      </span>
                    </button>

                    {/* Dropdown menu */}
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-secondary-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      {userNavigation.map((item) => (
                        <Link
                          key={item.name}
                          to={item.href}
                          className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors"
                        >
                          {item.name}
                        </Link>
                      ))}
                      <hr className="my-1 border-secondary-200" />
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="btn-ghost"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="btn-primary"
                  >
                    Sign up
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-secondary-500 hover:text-secondary-700 hover:bg-secondary-100 transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-secondary-200 bg-white">
            <div className="px-4 py-3 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="flex items-center px-3 py-2 text-base font-medium text-secondary-700 hover:text-secondary-900 hover:bg-secondary-50 rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              ))}
              
              {isAuthenticated && (
                <>
                  <hr className="my-2 border-secondary-200" />
                  <Link
                    to="/workflows/create"
                    className="flex items-center px-3 py-2 text-base font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Plus className="h-5 w-5 mr-3" />
                    Create Workflow
                  </Link>
                  
                  {userNavigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="flex items-center px-3 py-2 text-base font-medium text-secondary-700 hover:text-secondary-900 hover:bg-secondary-50 rounded-lg transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <User className="h-5 w-5 mr-3" />
                      {item.name}
                    </Link>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main>
        <Outlet />
      </main>
    </div>
  );
} 