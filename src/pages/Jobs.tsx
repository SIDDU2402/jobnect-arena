import { useState } from "react";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { JobCard } from "@/components/JobCard";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { 
  Search, MapPin, Filter, Briefcase, DollarSign, Calendar, ChevronDown, 
  ChevronUp, ArrowUpDown, X
} from "lucide-react";

const Jobs = () => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [location, setLocation] = useState("");
  const [salary, setSalary] = useState([0, 200]);
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<string[]>([]);
  
  // Sample job data with Indian Rupee format
  const jobs = [
    {
      id: "1",
      title: "Senior UX Designer",
      company: "Tech Solutions India",
      location: "Bangalore, India",
      salary: "₹18L - ₹25L",
      type: "Full-time",
      postedAt: "2 days ago",
      featured: true
    },
    {
      id: "2",
      title: "Front-end Developer",
      company: "IndiaTech",
      location: "Remote",
      salary: "₹12L - ₹18L",
      type: "Full-time",
      postedAt: "1 week ago"
    },
    {
      id: "3",
      title: "Product Marketing Manager",
      company: "Flipkart",
      location: "Mumbai, India",
      salary: "₹15L - ₹22L",
      type: "Full-time",
      postedAt: "3 days ago"
    },
    {
      id: "4",
      title: "Data Scientist",
      company: "Infosys",
      location: "Hyderabad, India",
      salary: "₹20L - ₹30L",
      type: "Full-time",
      postedAt: "5 days ago",
      featured: true
    },
    {
      id: "5",
      title: "DevOps Engineer",
      company: "TCS",
      location: "Pune, India",
      salary: "₹15L - ₹22L",
      type: "Full-time",
      postedAt: "1 week ago"
    },
    {
      id: "6",
      title: "Content Writer",
      company: "Content Labs",
      location: "Remote",
      salary: "₹6L - ₹10L",
      type: "Part-time",
      postedAt: "2 weeks ago"
    }
  ];
  
  const jobTypes = ["Full-time", "Part-time", "Contract", "Internship", "Remote"];
  const experienceLevels = ["Entry Level", "Mid Level", "Senior Level", "Director", "Executive"];
  
  const handleJobTypeChange = (type: string) => {
    setSelectedJobTypes((prev) =>
      prev.includes(type)
        ? prev.filter((item) => item !== type)
        : [...prev, type]
    );
  };
  
  const handleExperienceChange = (level: string) => {
    setSelectedExperience((prev) =>
      prev.includes(level)
        ? prev.filter((item) => item !== level)
        : [...prev, level]
    );
  };
  
  const clearFilters = () => {
    setSearchTerm("");
    setLocation("");
    setSalary([0, 200]);
    setSelectedJobTypes([]);
    setSelectedExperience([]);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      
      <main className="flex-1 pt-16">
        <div className="bg-primary/5 border-b border-border">
          <div className="container mx-auto px-4 md:px-6 py-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Find Your Perfect Job</h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
              Browse thousands of job listings and find the perfect match for your skills and experience.
            </p>
            
            <div className="max-w-5xl">
              <div className="bg-background rounded-xl shadow-sm p-3 flex flex-col md:flex-row gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Job title or keyword"
                    className="pl-10 h-12"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Location"
                    className="pl-10 h-12 md:w-52"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <Button className="h-12">Search Jobs</Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 md:px-6 py-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Filters (Desktop) */}
            <div className="hidden md:block w-64 space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="font-medium text-lg">Filters</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-2 text-muted-foreground hover:text-foreground"
                  onClick={clearFilters}
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Job Type</h3>
                </div>
                <div className="space-y-2">
                  {jobTypes.map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`job-type-${type}`}
                        checked={selectedJobTypes.includes(type)}
                        onCheckedChange={() => handleJobTypeChange(type)}
                      />
                      <label 
                        htmlFor={`job-type-${type}`}
                        className="text-sm cursor-pointer"
                      >
                        {type}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Experience Level</h3>
                </div>
                <div className="space-y-2">
                  {experienceLevels.map((level) => (
                    <div key={level} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`exp-${level}`}
                        checked={selectedExperience.includes(level)}
                        onCheckedChange={() => handleExperienceChange(level)}
                      />
                      <label 
                        htmlFor={`exp-${level}`}
                        className="text-sm cursor-pointer"
                      >
                        {level}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Salary Range (Lakhs)</h3>
                  <span className="text-sm text-muted-foreground">
                    ₹{salary[0]}L - ₹{salary[1]}L
                  </span>
                </div>
                <Slider
                  value={salary}
                  min={0}
                  max={200}
                  step={5}
                  onValueChange={setSalary}
                  className="py-4"
                />
              </div>
            </div>
            
            {/* Mobile Filters Toggle */}
            <Button
              variant="outline"
              className="md:hidden w-full flex items-center justify-between mb-4"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <div className="flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </div>
              {isFilterOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            
            {/* Mobile Filters */}
            {isFilterOpen && (
              <div className="md:hidden bg-background border border-border rounded-lg p-4 mb-4 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-medium text-lg">Filters</h2>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 text-muted-foreground hover:text-foreground"
                    onClick={clearFilters}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium">Job Type</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {jobTypes.map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`mobile-job-type-${type}`}
                          checked={selectedJobTypes.includes(type)}
                          onCheckedChange={() => handleJobTypeChange(type)}
                        />
                        <label 
                          htmlFor={`mobile-job-type-${type}`}
                          className="text-sm cursor-pointer"
                        >
                          {type}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="font-medium">Experience Level</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {experienceLevels.map((level) => (
                      <div key={level} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`mobile-exp-${level}`}
                          checked={selectedExperience.includes(level)}
                          onCheckedChange={() => handleExperienceChange(level)}
                        />
                        <label 
                          htmlFor={`mobile-exp-${level}`}
                          className="text-sm cursor-pointer"
                        >
                          {level}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Salary Range (Lakhs)</h3>
                    <span className="text-sm text-muted-foreground">
                      ₹{salary[0]}L - ₹{salary[1]}L
                    </span>
                  </div>
                  <Slider
                    value={salary}
                    min={0}
                    max={200}
                    step={5}
                    onValueChange={setSalary}
                    className="py-4"
                  />
                </div>
              </div>
            )}
            
            {/* Job Listings */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <h2 className="text-xl font-bold">
                  Showing <span className="text-primary">{jobs.length}</span> Jobs
                </h2>
                <div className="flex items-center mt-2 md:mt-0">
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    Sort by: Relevance
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                {jobs.map((job) => (
                  <JobCard key={job.id} {...job} />
                ))}
              </div>
              
              <div className="mt-8 flex justify-center">
                <Button variant="outline" className="mr-2">Previous</Button>
                <Button variant="outline" className="bg-primary/10 text-primary border-primary/20">1</Button>
                <Button variant="outline" className="mx-2">2</Button>
                <Button variant="outline" className="mr-2">3</Button>
                <Button variant="outline">Next</Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Jobs;
