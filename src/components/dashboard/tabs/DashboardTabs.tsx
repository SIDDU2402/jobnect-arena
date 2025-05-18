
import { FC } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DashboardTabsProps {
  activeTab: 'listings' | 'applications' | 'profile';
  onTabChange: (tab: 'listings' | 'applications' | 'profile') => void;
  children?: React.ReactNode;
}

const DashboardTabs: FC<DashboardTabsProps> = ({ 
  activeTab, 
  onTabChange,
  children
}) => {
  return (
    <div className="mb-6">
      <TabsList className="w-full sm:w-auto border-b border-border bg-transparent p-0 h-auto">
        <TabsTrigger 
          value="listings"
          className={`px-4 py-2 font-medium transition-colors rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none ${
            activeTab === 'listings' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => onTabChange('listings')}
        >
          Job Listings
        </TabsTrigger>
        <TabsTrigger 
          value="applications"
          className={`px-4 py-2 font-medium transition-colors rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none ${
            activeTab === 'applications' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => onTabChange('applications')}
        >
          Applications
        </TabsTrigger>
        <TabsTrigger 
          value="profile"
          className={`px-4 py-2 font-medium transition-colors rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none ${
            activeTab === 'profile' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => onTabChange('profile')}
        >
          Profile
        </TabsTrigger>
      </TabsList>
      {children}
    </div>
  );
};

export default DashboardTabs;
