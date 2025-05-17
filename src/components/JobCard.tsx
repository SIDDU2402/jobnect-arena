
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bookmark, MapPin, Clock, DollarSign, Building, Star, BookmarkCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

type JobCardProps = {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  postedAt: string;
  logo?: string;
  featured?: boolean;
  onApply?: () => void;
};

export const JobCard = ({
  id,
  title,
  company,
  location,
  salary,
  type,
  postedAt,
  logo,
  featured,
  onApply,
}: JobCardProps) => {
  const [saved, setSaved] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const defaultLogo = "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d";

  // Format salary to show ₹ symbol if it doesn't already have it
  const formattedSalary = salary.includes('₹') ? salary : salary.replace('$', '₹');

  // Format date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  return (
    <div 
      className={`relative group rounded-xl overflow-hidden transition-all duration-300 ${
        isHovering ? "shadow-soft scale-[1.01]" : "shadow-sm"
      } ${featured ? "ring-1 ring-primary/20" : ""}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {featured && (
        <motion.div 
          className="absolute top-3 left-0"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Badge className="rounded-l-none rounded-r-full bg-primary/10 text-primary border-primary/20 px-3 py-1">
            <Star className="h-3 w-3 mr-1 fill-primary" />
            Featured
          </Badge>
        </motion.div>
      )}
      
      <div className="p-6 bg-background border border-border rounded-xl">
        <div className="flex items-start gap-4">
          <motion.div 
            className="h-12 w-12 rounded-md overflow-hidden bg-secondary flex-shrink-0"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <img
              src={logo || defaultLogo}
              alt={`${company} logo`}
              className="h-full w-full object-cover"
            />
          </motion.div>
          
          <div className="flex-grow">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-lg hover:text-primary transition-colors">
                    <Link to={`/jobs/${id}`}>{title}</Link>
                  </h3>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Building className="h-4 w-4 mr-1" />
                  <span className="text-sm">{company}</span>
                </div>
              </div>
              
              <motion.div whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`${saved ? "text-primary" : "text-muted-foreground"} h-8 w-8`}
                  onClick={() => setSaved(!saved)}
                >
                  {saved ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <BookmarkCheck className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    <Bookmark className="h-5 w-5" />
                  )}
                </Button>
              </motion.div>
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-y-2 gap-x-4">
              <div className="flex items-center text-muted-foreground">
                <MapPin className="h-4 w-4 mr-2" />
                <span className="text-sm">{location}</span>
              </div>
              <div className="flex items-center text-muted-foreground">
                <DollarSign className="h-4 w-4 mr-2" />
                <span className="text-sm">{formattedSalary}</span>
              </div>
              <div className="flex items-center text-muted-foreground">
                <Clock className="h-4 w-4 mr-2" />
                <span className="text-sm">{formatDate(postedAt)}</span>
              </div>
              <div>
                <Badge variant="secondary" className="font-normal">
                  {type}
                </Badge>
              </div>
            </div>
            
            <div className="mt-5 pt-5 border-t border-border flex justify-end">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                {onApply ? (
                  <Button onClick={onApply}>Apply Now</Button>
                ) : (
                  <Link to={`/jobs/${id}`}>
                    <Button>View Details</Button>
                  </Link>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
