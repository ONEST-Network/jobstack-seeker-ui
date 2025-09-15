import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Mail, ArrowRight, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { orgSlug } = useParams<{ orgSlug?: string }>();
  const { refreshSession, user } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isResending, setIsResending] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'success' | 'error' | null>(null);
  const [errorType, setErrorType] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    // Set user email from current session if available
    if (user?.email) {
      setUserEmail(user.email);
    }
    handleEmailVerification();
  }, [user]);

  const handleEmailVerification = async () => {
    const error = searchParams.get('error');
    const token = searchParams.get('token');
    const action = searchParams.get('action');
    const verificationToken = searchParams.get('verification');
    const emailToken = searchParams.get('email_token');
    const verifyToken = searchParams.get('verify');
    const confirmToken = searchParams.get('confirm');
    const signupToken = searchParams.get('signup');
    const type = searchParams.get('type');
    
    // Check for various email verification token patterns
    const verificationTokenValue = token || verificationToken || emailToken || verifyToken || confirmToken || signupToken;
    
    if (error) {
      // Handle error cases
      setErrorType(error);
      setVerificationStatus('error');
      setIsLoading(false);
      return;
    }
    
    // Check if this is a password reset token - redirect to password reset route
    if (verificationTokenValue && type === 'password-reset') {
      navigate(`/auth/reset-password?token=${verificationTokenValue}`);
      return;
    }
    
    if (verificationTokenValue) {
      try {
        // Call the backend to verify the email token
        await apiClient.verifyEmailToken(verificationTokenValue);
        
        // Check for pending user data that should be activated
        const pendingUser = localStorage.getItem('pendingUser');
        if (pendingUser) {
          try {
            const parsedPendingUser = JSON.parse(pendingUser);
            // Update the pending user to be verified
            const verifiedUser = { ...parsedPendingUser, isVerified: true, emailVerified: true };
            localStorage.setItem('user', JSON.stringify(verifiedUser));
            localStorage.removeItem('pendingUser');
            setUserEmail(parsedPendingUser.email);
          } catch (error) {
            // Silently handle pending user processing error
          }
        }
        
        // Add a small delay to ensure the session is properly established
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Refresh the session to update the user state
        await refreshSession();
        
        setVerificationStatus('success');
        setIsLoading(false);
        
        // Show success toast
        toast({
          title: "Email Verified Successfully",
          description: "Your email has been verified and you are now logged in.",
        });
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate(`/${orgSlug || '0'}/seeker?tab=discover`);
        }, 2000);
        
      } catch (error: any) {
        // Handle specific error types from backend
        if (error.message?.includes('expired')) {
          setErrorType('expired_token');
        } else if (error.message?.includes('invalid')) {
          setErrorType('invalid_token');
        } else if (error.message?.includes('already verified')) {
          setErrorType('already_verified');
        } else if (error.message?.includes('user not found')) {
          setErrorType('user_not_found');
        } else {
          setErrorType('verification_failed');
        }
        
        setVerificationStatus('error');
        setIsLoading(false);
        
        toast({
          title: "Email Verification Failed",
          description: error.message || "Failed to verify your email. Please try again.",
          variant: "destructive"
        });
      }
    } else {
      // No token provided - check if user is already verified
      if (user && user.emailVerified) {
        setVerificationStatus('success');
        setIsLoading(false);
        toast({
          title: "Email Already Verified",
          description: "Your email is already verified. Redirecting to dashboard...",
        });
        setTimeout(() => {
          navigate(`/${orgSlug || '0'}/seeker?tab=discover`);
        }, 2000);
      } else {
        // No token provided and user not verified
        setVerificationStatus('error');
        setErrorType('invalid_token');
        setIsLoading(false);
      }
    }
  };

  const handleResendVerification = async () => {
    if (!userEmail) {
      toast({
        title: "Error",
        description: "No email address found. Please try logging in again or contact support.",
        variant: "destructive"
      });
      return;
    }

    setIsResending(true);
    try {
      await apiClient.sendVerificationEmail({
        email: userEmail,
        callbackURL: `${window.location.origin}/verify/email`
      });
      
      toast({
        title: "Verification Email Sent",
        description: "A new verification email has been sent to your inbox.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send verification email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleGoToLogin = () => {
    navigate(`/${orgSlug || '0'}/seeker?tab=discover`);
  };

  const getErrorMessage = (errorType: string) => {
    switch (errorType) {
      case 'invalid_token':
        return 'The verification link is invalid or malformed.';
      case 'expired_token':
        return 'The verification link has expired.';
      case 'verification_failed':
        return 'Email verification failed. Please try again.';
      case 'user_not_found':
        return 'User account not found.';
      case 'already_verified':
        return 'This email has already been verified.';
      default:
        return 'An error occurred during email verification.';
    }
  };

  const shouldShowResendButton = () => {
    return ['invalid_token', 'expired_token', 'verification_failed'].includes(errorType || '');
  };

  const shouldShowLoginButton = () => {
    return errorType === 'already_verified';
  };

  const shouldShowUserNotFound = () => {
    return errorType === 'user_not_found';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-lg font-medium">Verifying your email...</p>
              <p className="text-sm text-muted-foreground text-center">
                Please wait while we verify your email address.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {verificationStatus === 'success' ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
            Email Verification
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {verificationStatus === 'success' ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-900">Email Verified Successfully!</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Your email has been verified and you are now logged in.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Redirecting to dashboard...
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {getErrorMessage(errorType || '')}
                </AlertDescription>
              </Alert>

              {shouldShowResendButton() && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground text-center">
                    Would you like us to send you a new verification email?
                  </p>
                  <Button
                    onClick={handleResendVerification}
                    disabled={isResending}
                    className="w-full"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Resend Verification Email
                      </>
                    )}
                  </Button>
                  {!userEmail && (
                    <p className="text-xs text-muted-foreground text-center">
                      Note: If you don't receive the email, please try logging in again.
                    </p>
                  )}
                </div>
              )}

              {shouldShowLoginButton() && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground text-center">
                    Your email is already verified. You can now log in to your account.
                  </p>
                  <Button
                    onClick={handleGoToLogin}
                    className="w-full"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Go to Login
                  </Button>
                </div>
              )}

              {shouldShowUserNotFound() && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground text-center">
                    No account found with this email address. Please check your email or create a new account.
                  </p>
                  <Button
                    onClick={handleGoToLogin}
                    className="w-full"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Go to Login
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailVerification; 