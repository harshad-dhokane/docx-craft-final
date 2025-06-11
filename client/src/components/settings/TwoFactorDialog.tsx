import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Smartphone, Shield, CheckCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TwoFactorDialogProps {
  children: React.ReactNode;
}

export const TwoFactorDialog = ({ children }: TwoFactorDialogProps) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'status' | 'enable' | 'disable'>('status');
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      checkMfaStatus();
    }
  }, [open]);

  const checkMfaStatus = async () => {
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.totp?.find(factor => factor.status === 'verified');
      setMfaEnabled(!!totpFactor);
    } catch (error) {
      console.error('Error checking MFA status:', error);
    }
  };

  const enableMfa = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App'
      });

      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setStep('enable');
    } catch (error: any) {
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to set up two-factor authentication.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAndComplete = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit verification code.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const factor = factors?.totp?.[0];
      
      if (!factor) throw new Error('No MFA factor found');

      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: factor.id,
        code: verificationCode
      });

      if (error) throw error;

      toast({
        title: "Two-Factor Authentication Enabled",
        description: "Your account is now secured with 2FA.",
      });

      setMfaEnabled(true);
      setStep('status');
      setVerificationCode('');
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid verification code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const disableMfa = async () => {
    setIsLoading(true);
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const factor = factors?.totp?.find(f => f.status === 'verified');
      
      if (!factor) throw new Error('No active MFA factor found');

      const { error } = await supabase.auth.mfa.unenroll({
        factorId: factor.id
      });

      if (error) throw error;

      toast({
        title: "Two-Factor Authentication Disabled",
        description: "2FA has been removed from your account.",
      });

      setMfaEnabled(false);
      setStep('status');
    } catch (error: any) {
      toast({
        title: "Disable Failed",
        description: error.message || "Failed to disable two-factor authentication.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    switch (step) {
      case 'status':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              {mfaEnabled ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-orange-600" />
              )}
              <div>
                <p className="font-medium">
                  Two-Factor Authentication is {mfaEnabled ? 'Enabled' : 'Disabled'}
                </p>
                <p className="text-sm text-gray-500">
                  {mfaEnabled 
                    ? 'Your account is protected with 2FA'
                    : 'Add an extra layer of security to your account'
                  }
                </p>
              </div>
              <Badge variant={mfaEnabled ? 'default' : 'secondary'} className={mfaEnabled ? 'bg-green-100 text-green-800' : ''}>
                {mfaEnabled ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            
            <div className="flex space-x-2 pt-4">
              {mfaEnabled ? (
                <Button 
                  variant="outline" 
                  onClick={() => setStep('disable')}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Disable 2FA
                </Button>
              ) : (
                <Button onClick={enableMfa} disabled={isLoading}>
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : null}
                  Enable 2FA
                </Button>
              )}
            </div>
          </div>
        );

      case 'enable':
        return (
          <div className="space-y-4">
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </p>
              {qrCode && (
                <div className="flex justify-center">
                  <img src={qrCode} alt="QR Code" className="w-48 h-48 border rounded-lg" />
                </div>
              )}
              <div className="space-y-2">
                <Label>Or enter this secret manually:</Label>
                <Input value={secret} readOnly className="font-mono text-sm" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="verification-code">Enter 6-digit verification code</Label>
              <Input
                id="verification-code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="text-center text-lg tracking-widest"
                maxLength={6}
              />
            </div>

            <div className="flex space-x-2 pt-4">
              <Button variant="outline" onClick={() => setStep('status')}>
                Cancel
              </Button>
              <Button onClick={verifyAndComplete} disabled={isLoading || verificationCode.length !== 6}>
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : null}
                Verify & Enable
              </Button>
            </div>
          </div>
        );

      case 'disable':
        return (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <AlertCircle className="h-12 w-12 text-orange-600 mx-auto" />
              <h3 className="font-semibold">Disable Two-Factor Authentication</h3>
              <p className="text-sm text-gray-600">
                Are you sure you want to disable 2FA? This will make your account less secure.
              </p>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button variant="outline" onClick={() => setStep('status')}>
                Cancel
              </Button>
              <Button 
                onClick={disableMfa} 
                disabled={isLoading}
                variant="destructive"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : null}
                Disable 2FA
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Smartphone className="h-5 w-5 text-blue-600" />
            <span>Two-Factor Authentication</span>
          </DialogTitle>
          <DialogDescription>
            Secure your account with an additional verification step.
          </DialogDescription>
        </DialogHeader>
        
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};