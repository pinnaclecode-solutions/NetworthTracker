import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginButton } from "./LoginButton";
import { TrendingUp, Shield, BarChart2, Clock } from "lucide-react";

export const metadata = { title: "Sign In — NetWorth Tracker" };

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-cream-100 to-primary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl shadow-warm-lg mb-4">
            <TrendingUp size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-stone-800">NetWorth Tracker</h1>
          <p className="text-stone-500 mt-2 text-base">
            Your friendly financial companion
          </p>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-2xl shadow-warm-lg border border-stone-100 p-8">
          <h2 className="text-xl font-semibold text-stone-800 mb-2 text-center">
            Welcome back
          </h2>
          <p className="text-stone-500 text-sm text-center mb-8">
            Sign in to track your financial journey
          </p>

          <LoginButton />

          <p className="text-xs text-stone-400 text-center mt-6">
            By signing in, you agree to keep your financial data private and secure.
            We only use your Google account for authentication.
          </p>
        </div>

        {/* Feature highlights */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          {[
            { icon: BarChart2, label: "Track Progress", desc: "Visual charts & trends" },
            { icon: Shield, label: "Private", desc: "Your data stays yours" },
            { icon: Clock, label: "Snapshots", desc: "Historical records" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-primary-50 rounded-xl mb-2">
                <Icon size={18} className="text-primary-600" />
              </div>
              <p className="text-xs font-medium text-stone-700">{label}</p>
              <p className="text-xs text-stone-400">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
