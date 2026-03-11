import { AuthForm } from "@/components/auth-form";

export default function SignupPage() {
  return (
    <div className="shell pb-8 pt-6">
      <AuthForm mode="signup" />
    </div>
  );
}
