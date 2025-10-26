import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useIsUdesEmail = () => {
  const [isUdesEmail, setIsUdesEmail] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const checkEmail = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user?.email) {
          setIsUdesEmail(false);
          setUserEmail(null);
          return;
        }

        setUserEmail(user.email);
        const isUdes = user.email.endsWith('@mail.udes.edu.co');
        setIsUdesEmail(isUdes);
      } catch (error) {
        console.error('Error checking UDES email:', error);
        setIsUdesEmail(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkEmail();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkEmail();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { isUdesEmail, isLoading, userEmail };
};
