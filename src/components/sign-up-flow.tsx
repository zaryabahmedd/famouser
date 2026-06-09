import { useState } from 'react';

import { EnablePermissions } from '@/components/enable-permissions';
import { ForgotPassword } from '@/components/forgot-password';
import { Login } from '@/components/login';
import { OtpVerification } from '@/components/otp-verification';
import { ResetPassword } from '@/components/reset-password';
import { SignUp, type SignUpValues } from '@/components/sign-up';
import { supabase } from '@/lib/supabase';

type SignUpFlowProps = {
  onComplete: () => void;
};

type ForgotStep = 'email' | 'otp' | 'password' | null;

export function SignUpFlow({ onComplete }: SignUpFlowProps) {
  const [showLogin, setShowLogin] = useState(true);
  const [forgotStep, setForgotStep] = useState<ForgotStep>(null);
  const [forgotEmail, setForgotEmail] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [signUpData, setSignUpData] = useState<SignUpValues | null>(null);

  const handleSignUp = async (values: SignUpValues): Promise<string | null> => {
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { full_name: values.name, phone_number: values.phone },
      },
    });
    if (error) return error.message;

    // Supabase returns a user with an empty `identities` array (and sends no
    // email) when the address is already registered. Surface a clear message
    // instead of sending the user to an OTP screen that never receives a code.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return 'This email is already registered. Please log in instead.';
    }

    setSignUpData(values);
    setShowOtp(true);
    return null;
  };

  const handleVerifyOtp = async (code: string): Promise<string | null> => {
    if (!signUpData) return 'Something went wrong. Please start again.';

    const { data, error } = await supabase.auth.verifyOtp({
      email: signUpData.email,
      token: code,
      type: 'signup',
    });
    if (error) return error.message;

    const userId = data.user?.id;
    if (userId) {
      const { error: profileError } = await supabase.from('users').upsert({
        id: userId,
        full_name: signUpData.name,
        email: signUpData.email,
        phone_number: signUpData.phone,
      });
      if (profileError) return profileError.message;
    }

    setShowOtp(false);
    setShowPermissions(true);
    return null;
  };

  const handleResendOtp = async (): Promise<string | null> => {
    if (!signUpData) return 'Something went wrong. Please start again.';
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: signUpData.email,
    });
    return error ? error.message : null;
  };

  const handleLogin = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    onComplete();
    return null;
  };

  const handleForgotEmailSubmit = async (email: string): Promise<string | null> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) return error.message;
    setForgotEmail(email);
    setForgotStep('otp');
    return null;
  };

  const handleForgotVerifyOtp = async (code: string): Promise<string | null> => {
    if (!forgotEmail) return 'Something went wrong. Please start again.';
    const { error } = await supabase.auth.verifyOtp({
      email: forgotEmail,
      token: code,
      type: 'recovery',
    });
    if (error) return error.message;
    setForgotStep('password');
    return null;
  };

  const handleForgotResendOtp = async (): Promise<string | null> => {
    if (!forgotEmail) return 'Something went wrong. Please start again.';
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail);
    return error ? error.message : null;
  };

  const handleResetPassword = async (newPassword: string): Promise<string | null> => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return error.message;
    // Sign out so the user must log in with the new password.
    await supabase.auth.signOut();
    setForgotStep(null);
    setForgotEmail('');
    setShowLogin(true);
    return null;
  };

  if (forgotStep === 'password') {
    return (
      <ResetPassword
        onBack={() => setForgotStep('otp')}
        onSubmit={handleResetPassword}
      />
    );
  }

  if (forgotStep === 'otp') {
    return (
      <OtpVerification
        destination={forgotEmail}
        title="Enter reset code"
        stepLabel="RESET PASSWORD · STEP 2/3"
        progress={2 / 3}
        onVerify={handleForgotVerifyOtp}
        onResend={handleForgotResendOtp}
        onBack={() => setForgotStep('email')}
      />
    );
  }

  if (forgotStep === 'email') {
    return (
      <ForgotPassword
        onBack={() => {
          setForgotStep(null);
          setForgotEmail('');
        }}
        onSubmit={handleForgotEmailSubmit}
      />
    );
  }

  if (showLogin) {
    return (
      <Login
        onLogin={handleLogin}
        onSignUp={() => setShowLogin(false)}
        onForgotPassword={() => setForgotStep('email')}
      />
    );
  }

  if (showPermissions) {
    return <EnablePermissions onContinue={onComplete} onSkip={onComplete} />;
  }

  if (showOtp) {
    return (
      <OtpVerification
        destination={signUpData?.email}
        onVerify={handleVerifyOtp}
        onResend={handleResendOtp}
        onBack={() => setShowOtp(false)}
      />
    );
  }

  return (
    <SignUp
      onContinue={handleSignUp}
      onBack={() => setShowLogin(true)}
      onLogIn={() => setShowLogin(true)}
    />
  );
}
