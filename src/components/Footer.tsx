
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-background/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <span className="text-white font-medium text-lg">J</span>
              </div>
              <span className="font-medium text-xl">JobNect</span>
            </Link>
            <p className="text-muted-foreground mb-6 max-w-md">
              Connecting employers with top talent through an intelligent 
              job portal that streamlines the hiring process.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-9 h-9 rounded-full bg-background flex items-center justify-center border border-border hover:bg-secondary transition-colors">
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-background flex items-center justify-center border border-border hover:bg-secondary transition-colors">
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                </svg>
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-background flex items-center justify-center border border-border hover:bg-secondary transition-colors">
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect x="2" y="9" width="4" height="12"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-base mb-4">Product</h4>
            <ul className="space-y-3">
              <li><Link to="#" className="text-muted-foreground hover:text-foreground">Features</Link></li>
              <li><Link to="#" className="text-muted-foreground hover:text-foreground">For Employers</Link></li>
              <li><Link to="#" className="text-muted-foreground hover:text-foreground">For Job Seekers</Link></li>
              <li><Link to="#" className="text-muted-foreground hover:text-foreground">Pricing</Link></li>
              <li><Link to="#" className="text-muted-foreground hover:text-foreground">Testimonials</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-base mb-4">Company</h4>
            <ul className="space-y-3">
              <li><Link to="#" className="text-muted-foreground hover:text-foreground">About</Link></li>
              <li><Link to="#" className="text-muted-foreground hover:text-foreground">Blog</Link></li>
              <li><Link to="#" className="text-muted-foreground hover:text-foreground">Careers</Link></li>
              <li><Link to="#" className="text-muted-foreground hover:text-foreground">Press</Link></li>
              <li><Link to="#" className="text-muted-foreground hover:text-foreground">Contact</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-base mb-4">Legal</h4>
            <ul className="space-y-3">
              <li><Link to="#" className="text-muted-foreground hover:text-foreground">Terms of Service</Link></li>
              <li><Link to="#" className="text-muted-foreground hover:text-foreground">Privacy Policy</Link></li>
              <li><Link to="#" className="text-muted-foreground hover:text-foreground">Cookies</Link></li>
              <li><Link to="#" className="text-muted-foreground hover:text-foreground">Security</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} JobNect. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground flex items-center">
            Made with <Heart className="h-4 w-4 mx-1 text-red-500" /> for a better hiring experience
          </p>
        </div>
      </div>
    </footer>
  );
};
