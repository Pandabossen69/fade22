import { LoginForm } from "@/components/admin/login-form";
import { site } from "@/lib/site";

export default function AdminLoginPage() {
  return (
    <div className="mx-auto max-w-md pt-10">
      <p className="kicker mb-3">{site.nameEn}</p>
      <LoginForm />
    </div>
  );
}
