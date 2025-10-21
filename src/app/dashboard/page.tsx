import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("fb_token")?.value;
  if (!token) redirect("/login?callbackUrl=/dashboard");

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mt-2 text-black/70 dark:text-white/70">Welcome to your dashboard.</p>
      <div className="mt-6 rounded-xl border border-black/[.08] dark:border-white/[.145] p-6">
        <p className="text-sm text-black/70 dark:text-white/70">Protected content visible only to signed-in users.</p>
      </div>
    </div>
  );
}


