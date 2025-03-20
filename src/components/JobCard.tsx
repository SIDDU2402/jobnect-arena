
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bookmark, MapPin, Clock, DollarSign, Building, Star, BookmarkCheck } from "lucide-react";
import { Link } from "react-router-dom";

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

  return (
    <div 
      className={`relative group rounded-xl overflow-hidden transition-all duration-300 ${
        isHovering ? "shadow-soft scale-[1.01]" : "shadow-sm"
      } ${featured ? "ring-1 ring-primary/20" : ""}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {featured && (
        <div className="absolute top-3 left-0">
          <Badge className="rounded-l-none rounded-r-full bg-primary/10 text-primary border-primary/20 px-3 py-1">
            <Star className="h-3 w-3 mr-1 fill-primary" />
            Featured
          </Badge>
        </div>
      )}
      
      <div className="p-6 bg-background border border-border rounded-xl">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-md overflow-hidden bg-secondary flex-shrink-0">
            <img
              src={logo || defaultLogo}
              alt={`${company} logo`}
              className="h-full w-full object-cover"
            />
          </div>
          
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
              
              <Button
                variant="ghost"
                size="icon"
                className={`${saved ? "text-primary" : "text-muted-foreground"} h-8 w-8`}
                onClick={() => setSaved(!saved)}
              >
                {saved ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
              </Button>
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
                <span className="text-sm">{postedAt}</span>
              </div>
              <div>
                <Badge variant="secondary" className="font-normal">
                  {type}
                </Badge>
              </div>
            </div>
            
            <div className="mt-5 pt-5 border-t border-border flex justify-end">
              {onApply ? (
                <Button onClick={onApply}>Apply Now</Button>
              ) : (
                <Link to={`/jobs/${id}`}>
                  <Button>View Details</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
