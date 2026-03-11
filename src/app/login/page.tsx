import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <div className="shell pb-8 pt-6">
      <AuthForm mode="login" />
    </div>
  );
}
