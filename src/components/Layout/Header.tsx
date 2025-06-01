import React, { useState } from 'react';
import { Link } from '../ui/Link';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { User, Menu, X } from 'lucide-react';

const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="sticky top-0 z-50 bg-black text-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2 text-[#9b9b6f] hover:text-[#7a7a58] transition-colors">
            <img 
              src={import.meta.env.VITE_LOGO_URL || "https://cdn.shopify.com/s/files/1/0567/5237/3945/files/png_bb_logo.png?v=1746303427"} 
              alt="Battle Bunker Logo" 
              className="h-8 w-auto"
            />
            <span className="text-xl font-bold tracking-wider"></span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="font-medium hover:text-[#9b9b6f] transition-colors">Home</Link>
            <Link href="/leaderboard" className="font-medium hover:text-[#9b9b6f] transition-colors">Leaderboard</Link>
            {user ? (
              <div className="flex items-center space-x-4">
                <Link href="/profile" className="flex items-center space-x-2 font-medium hover:text-[#9b9b6f] transition-colors">
                  <User size={20} />
                  <span>{user.email}</span>
                </Link>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => signOut()}
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Link href="/login" className="font-medium hover:text-[#9b9b6f] transition-colors">Login</Link>
            )}
          </nav>
          
          <button 
            className="md:hidden text-white focus:outline-none" 
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X size={24} />
            ) : (
              <Menu size={24} />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-black border-t border-gray-800 shadow-lg">
            <nav className="flex flex-col space-y-4 p-4">
              <Link 
                href="/" 
                className="font-medium hover:text-[#9b9b6f] transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="/leaderboard" 
                className="font-medium hover:text-[#9b9b6f] transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Leaderboard
              </Link>
              {user ? (
                <>
                  <Link 
                    href="/profile" 
                    className="flex items-center space-x-2 font-medium hover:text-[#9b9b6f] transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User size={20} />
                    <span>{user.email}</span>
                  </Link>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => {
                      signOut();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <Link 
                  href="/login" 
                  className="font-medium hover:text-[#9b9b6f] transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;