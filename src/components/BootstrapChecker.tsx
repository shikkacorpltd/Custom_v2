import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface BootstrapCheckerProps {
  children: React.ReactNode;
}

const BootstrapChecker = ({ children }: BootstrapCheckerProps) => {
  const [loading, setLoading] = useState(true);
  const [needsBootstrap, setNeedsBootstrap] = useState(false);

  useEffect(() => {
    const checkBootstrapStatus = async () => {
      try {
        const { data, error } = await supabase
          .rpc('super_admin_exists');

        if (error) {
          console.error('Error checking super admins:', error);
          setNeedsBootstrap(false);
        } else {
          // If super admin exists (data is true), no bootstrap needed
          setNeedsBootstrap(!data);
        }
      } catch (error) {
        console.error('Error checking bootstrap status:', error);
        setNeedsBootstrap(false);
      } finally {
        setLoading(false);
      }
    };

    checkBootstrapStatus();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-primary/5 to-secondary/20 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-lg text-foreground">Initializing...</span>
        </div>
      </div>
    );
  }

  if (needsBootstrap) {
    return <Navigate to="/bootstrap" replace />;
  }

  return <>{children}</>;
};

export default BootstrapChecker;