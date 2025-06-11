import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AuthCallback = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          toast({
            title: "Authentication Error",
            description: error.message,
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        if (data.session) {
          toast({
            title: "Welcome!",
            description: "Your email has been confirmed successfully.",
          });
          navigate('/');
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Callback handling error:', error);
        navigate('/');
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Confirming your account...</h2>
        <p className="text-gray-600">Please wait while we process your email confirmation.</p>
      </div>
    </div>
  );
};

export default AuthCallback;