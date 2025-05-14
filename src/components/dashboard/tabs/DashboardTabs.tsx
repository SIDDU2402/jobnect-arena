
interface DashboardTabsProps {
  activeTab: 'listings' | 'applications' | 'profile';
  onTabChange: (tab: 'listings' | 'applications' | 'profile') => void;
}

const DashboardTabs = ({ activeTab, onTabChange }: DashboardTabsProps) => {
  return (
    <div className="flex border-b border-border mb-6">
      <button
        className={`px-4 py-2 font-medium transition-colors ${
          activeTab === 'listings' 
            ? 'text-primary border-b-2 border-primary' 
            : 'text-muted-foreground hover:text-foreground'
        }`}
        onClick={() => onTabChange('listings')}
      >
        Job Listings
      </button>
      <button
        className={`px-4 py-2 font-medium transition-colors ${
          activeTab === 'applications' 
            ? 'text-primary border-b-2 border-primary' 
            : 'text-muted-foreground hover:text-foreground'
        }`}
        onClick={() => onTabChange('applications')}
      >
        Applications
      </button>
      <button
        className={`px-4 py-2 font-medium transition-colors ${
          activeTab === 'profile' 
            ? 'text-primary border-b-2 border-primary' 
            : 'text-muted-foreground hover:text-foreground'
        }`}
        onClick={() => onTabChange('profile')}
      >
        Profile
      </button>
    </div>
  );
};

export default DashboardTabs;
