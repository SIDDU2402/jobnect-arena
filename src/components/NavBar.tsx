
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export const NavBar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "py-3 bg-background/80 backdrop-blur-lg shadow-sm"
          : "py-5 bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <span className="text-white font-medium text-lg">J</span>
          </div>
          <span className="font-medium text-xl">JobNect</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className={`nav-link ${isActive('/') ? 'nav-link-active' : ''}`}>
            Home
          </Link>
          <Link to="/jobs" className={`nav-link ${isActive('/jobs') ? 'nav-link-active' : ''}`}>
            Jobs
          </Link>
          <Link to="/employers" className={`nav-link ${isActive('/employers') ? 'nav-link-active' : ''}`}>
            Employers
          </Link>
          <Link to="/about" className={`nav-link ${isActive('/about') ? 'nav-link-active' : ''}`}>
            About
          </Link>
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild>
            <Link to="/register">Sign up</Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-lg shadow-md animate-fade-in">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
            <Link 
              to="/" 
              className={`px-3 py-2 rounded-md ${isActive('/') ? 'bg-secondary font-medium' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/jobs" 
              className={`px-3 py-2 rounded-md ${isActive('/jobs') ? 'bg-secondary font-medium' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Jobs
            </Link>
            <Link 
              to="/employers" 
              className={`px-3 py-2 rounded-md ${isActive('/employers') ? 'bg-secondary font-medium' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Employers
            </Link>
            <Link 
              to="/about" 
              className={`px-3 py-2 rounded-md ${isActive('/about') ? 'bg-secondary font-medium' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <hr className="my-2 border-border" />
            <div className="flex flex-col gap-3">
              <Button variant="outline" asChild className="justify-center">
                <Link to="/login" onClick={() => setIsMenuOpen(false)}>Log in</Link>
              </Button>
              <Button asChild className="justify-center">
                <Link to="/register" onClick={() => setIsMenuOpen(false)}>Sign up</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
