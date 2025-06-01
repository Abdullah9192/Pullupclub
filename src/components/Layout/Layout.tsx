import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  
  // List of paths where we don't want to show the navbar
  const hideNavbarPaths = ['/login', '/', '/create-account', '/subscription'];
  const shouldShowNavbar = !hideNavbarPaths.includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col">
      {shouldShowNavbar && <Header />}
      <main className="flex-grow">
        {children}
      </main>
      {shouldShowNavbar && <Footer />}
    </div>
  );
};

export default Layout;