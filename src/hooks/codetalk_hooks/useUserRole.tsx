import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useUserRole = () => {
  const { session } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const userId = session?.user?.id;

  useEffect(() => {
    let isMounted = true;

    const fetchRole = async () => {
      if (!userId) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        // console.log('Fetching role for userId:', userId);
        const { data, error } = await supabase
          .from('profiles')
          .select('role, is_admin')
          .eq('id', userId);

        const profile = data?.[0];

        // console.log('Role query result:', { data, error });

        if (isMounted) {
          if (error) {
            console.error('Error fetching user role:', error);
            setRole(null);
          } else {
            // is_admin이 true이면 'admin' role로 설정
            const userRole = profile?.is_admin ? 'admin' : (profile?.role || null);
            // console.log('Setting role to:', userRole);
            setRole(userRole);
          }
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching user role:', error);
          setRole(null);
          setLoading(false);
        }
      }
    };

    fetchRole();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  // console.log('useUserRole return:', { role, isAdmin: role === 'admin', loading });
  
  return {
    role,
    isAdmin: role === 'admin',
    loading
  };
};