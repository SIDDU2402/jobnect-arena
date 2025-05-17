
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ensureStorageBuckets } from './integrations/supabase/client.ts'

// Initialize the application
console.log("Initializing application");
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

// Ensure storage buckets exist
ensureStorageBuckets().catch(error => {
  console.error("Failed to initialize storage buckets:", error);
});

createRoot(rootElement).render(<App />);
