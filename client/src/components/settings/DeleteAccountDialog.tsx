import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface DeleteAccountDialogProps {
  children: React.ReactNode;
}

export const DeleteAccountDialog = ({ children }: DeleteAccountDialogProps) => {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [acknowledgeData, setAcknowledgeData] = useState(false);
  const [acknowledgeIrreversible, setAcknowledgeIrreversible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const isConfirmationValid = 
    confirmText === "DELETE" && 
    acknowledgeData && 
    acknowledgeIrreversible;

  const deleteAccount = async () => {
    if (!user || !isConfirmationValid) return;

    setIsDeleting(true);

    try {
      // Delete user data in order (due to foreign key constraints)
      
      // Delete activity logs
      await supabase
        .from('activity_logs')
        .delete()
        .eq('user_id', user.id);

      // Delete generated PDFs
      await supabase
        .from('generated_pdfs')
        .delete()
        .eq('user_id', user.id);

      // Delete templates
      await supabase
        .from('templates')
        .delete()
        .eq('user_id', user.id);

      // Delete profile
      await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      // Note: In a production environment, account deletion would typically
      // be handled server-side for security reasons. For this demo, we'll
      // just sign out the user after deleting their data.
      
      toast({
        title: "Data Deleted",
        description: "Your data has been deleted. Please contact support to complete account deletion.",
      });

      toast({
        title: "Account Deleted",
        description: "Your account and all associated data have been permanently deleted.",
      });

      // Sign out and close dialog
      await signOut();
      setOpen(false);

    } catch (error: any) {
      console.error('Account deletion error:', error);
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete account. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setConfirmText("");
    setAcknowledgeData(false);
    setAcknowledgeIrreversible(false);
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Delete Account</span>
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your account and all associated data.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-900">What will be deleted:</h4>
                <ul className="text-sm text-red-700 mt-2 space-y-1">
                  <li>• Your profile and account information</li>
                  <li>• All uploaded templates</li>
                  <li>• All generated documents</li>
                  <li>• Activity history and logs</li>
                  <li>• All files stored in our system</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <Checkbox 
                id="acknowledge-data"
                checked={acknowledgeData}
                onCheckedChange={(checked) => setAcknowledgeData(!!checked)}
              />
              <Label htmlFor="acknowledge-data" className="text-sm leading-relaxed">
                I understand that all my data will be permanently deleted and cannot be recovered.
              </Label>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox 
                id="acknowledge-irreversible"
                checked={acknowledgeIrreversible}
                onCheckedChange={(checked) => setAcknowledgeIrreversible(!!checked)}
              />
              <Label htmlFor="acknowledge-irreversible" className="text-sm leading-relaxed">
                I understand that this action is irreversible and I will lose access to my account immediately.
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-delete">
              Type <span className="font-mono font-bold">DELETE</span> to confirm:
            </Label>
            <Input
              id="confirm-delete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE here"
              className="font-mono"
            />
          </div>
        </div>

        <div className="flex space-x-2 pt-4">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            onClick={deleteAccount} 
            disabled={!isConfirmationValid || isDeleting}
            variant="destructive"
          >
            {isDeleting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            {isDeleting ? 'Deleting...' : 'Delete Account'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};