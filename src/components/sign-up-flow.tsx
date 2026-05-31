import { useState } from 'react';

import { EnablePermissions } from '@/components/enable-permissions';
import { ForgotPassword } from '@/components/forgot-password';
import { Login } from '@/components/login';
import { OtpVerification } from '@/components/otp-verification';
import { SignUp } from '@/components/sign-up';

type SignUpFlowProps = {
  onComplete: () => void;
};

export function SignUpFlow({ onComplete }: SignUpFlowProps) {
  const [showLogin, setShowLogin] = useState(true);
  const [showForgot, setShowForgot] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);

  if (showForgot) {
    return <ForgotPassword onBack={() => setShowForgot(false)} onDone={() => setShowForgot(false)} />;
  }

  if (showLogin) {
    return (
      <Login
        onLogin={onComplete}
        onSignUp={() => setShowLogin(false)}
        onForgotPassword={() => setShowForgot(true)}
      />
    );
  }

  if (showPermissions) {
    return <EnablePermissions onContinue={onComplete} onSkip={onComplete} />;
  }

  if (showOtp) {
    return (
      <OtpVerification
        onVerify={() => setShowPermissions(true)}
        onBack={() => setShowOtp(false)}
      />
    );
  }

  return (
    <SignUp
      onContinue={() => setShowOtp(true)}
      onLogIn={() => setShowLogin(true)}
    />
  );
}
