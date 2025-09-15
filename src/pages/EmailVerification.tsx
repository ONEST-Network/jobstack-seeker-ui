import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Mail, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { orgSlug } = useParams<{ orgSlug?: string }>();
  const { refreshSession, user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(true);
  const [isResending, setIsResending] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'success' | 'error' | null>(null);
  const [errorType, setErrorType] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
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

    const verificationTokenValue =
      token || verificationToken || emailToken || verifyToken || confirmToken || signupToken;

    if (error) {
      setErrorType(error);
      setVerificationStatus('error');
      setIsLoading(false);
      return;
    }

    if (verificationTokenValue && type === 'password-reset') {
      navigate(`/auth/reset-password?token=${verificationTokenValue}`);
      return;
    }

    if (verificationTokenValue) {
      try {
        await apiClient.verifyEmailToken(verificationTokenValue);

        const pendingUser = localStorage.getItem('pendingUser');
        if (pendingUser) {
          try {
            const parsedPendingUser = JSON.parse(pendingUser);
            const verifiedUser = { ...parsedPendingUser, isVerified: true, emailVerified: true };
            localStorage.setItem('user', JSON.stringify(verifiedUser));
            localStorage.removeItem('pendingUser');
            setUserEmail(parsedPendingUser.email);
          } catch {}
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        await refreshSession();

        setVerificationStatus('success');
        setIsLoading(false);

        toast({
          title: t("email.verification.successToast.title"),
          description: t("email.verification.successToast.desc"),
        });

        setTimeout(() => {
          navigate(`/${orgSlug || '0'}/seeker?tab=discover`);
        }, 2000);
      } catch (error: any) {
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
          title: t("email.verification.errorToast.title"),
          description: error.message || t("email.verification.errorToast.desc"),
          variant: "destructive"
        });
      }
    } else {
      if (user && user.emailVerified) {
        setVerificationStatus('success');
        setIsLoading(false);
        toast({
          title: t("email.verification.alreadyVerifiedToast.title"),
          description: t("email.verification.alreadyVerifiedToast.desc"),
        });
        setTimeout(() => {
          navigate(`/${orgSlug || '0'}/seeker?tab=discover`);
        }, 2000);
      } else {
        setVerificationStatus('error');
        setErrorType('invalid_token');
        setIsLoading(false);
      }
    }
  };

  const handleResendVerification = async () => {
    if (!userEmail) {
      toast({
        title: t("email.verification.noEmailToast.title"),
        description: t("email.verification.noEmailToast.desc"),
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
        title: t("email.verification.resendSuccessToast.title"),
        description: t("email.verification.resendSuccessToast.desc"),
      });
    } catch (error: any) {
      toast({
        title: t("email.verification.errorToast.title"),
        description: error.message || t("email.verification.errorToast.desc"),
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
        return t("email.verification.errors.invalid_token");
      case 'expired_token':
        return t("email.verification.errors.expired_token");
      case 'verification_failed':
        return t("email.verification.errors.verification_failed");
      case 'user_not_found':
        return t("email.verification.errors.user_not_found");
      case 'already_verified':
        return t("email.verification.errors.already_verified");
      default:
        return t("email.verification.errors.default");
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
              <p className="text-lg font-medium">{t("email.verification.loading.title")}</p>
              <p className="text-sm text-muted-foreground text-center">
                {t("email.verification.loading.desc")}
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
            {t("email.verification.title")}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {verificationStatus === 'success' ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-900">
                  {t("email.verification.success.title")}
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {t("email.verification.success.desc")}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("email.verification.success.redirect")}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{getErrorMessage(errorType || '')}</AlertDescription>
              </Alert>

              {shouldShowResendButton() && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground text-center">
                    {t("email.verification.resend.prompt")}
                  </p>
                  <Button
                    onClick={handleResendVerification}
                    disabled={isResending}
                    className="w-full"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t("email.verification.resend.sending")}
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        {t("email.verification.resend.button")}
                      </>
                    )}
                  </Button>
                  {!userEmail && (
                    <p className="text-xs text-muted-foreground text-center">
                      {t("email.verification.resend.note")}
                    </p>
                  )}
                </div>
              )}

              {shouldShowLoginButton() && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground text-center">
                    {t("email.verification.alreadyVerified.desc")}
                  </p>
                  <Button onClick={handleGoToLogin} className="w-full">
                    <User className="h-4 w-4 mr-2" />
                    {t("email.verification.alreadyVerified.button")}
                  </Button>
                </div>
              )}

              {shouldShowUserNotFound() && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground text-center">
                    {t("email.verification.userNotFound.desc")}
                  </p>
                  <Button onClick={handleGoToLogin} className="w-full">
                    <User className="h-4 w-4 mr-2" />
                    {t("email.verification.userNotFound.button")}
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
