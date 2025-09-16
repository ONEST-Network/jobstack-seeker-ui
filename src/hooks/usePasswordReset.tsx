import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export const usePasswordReset = () => {
  const { toast } = useToast();

  const sendPasswordResetEmail = async (email: string) => {
    try {
      await apiClient.sendPasswordResetEmail({
        email,
        callbackURL: `${window.location.origin}/auth/reset-password`
      });
      
      toast({
        title: "Reset Link Sent",
        description: "If an account with that email exists, we've sent you a password reset link.",
      });
      
      return { success: true };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email. Please try again.",
        variant: "destructive"
      });
      
      return { success: false, error: error.message };
    }
  };

  return {
    sendPasswordResetEmail
  };
}; 