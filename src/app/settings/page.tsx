import { redirect } from "next/navigation";
import Image from "next/image";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";
import { User, Download, Trash2, Shield, Settings } from "lucide-react";
import { DeleteAccountButton } from "./DeleteAccountButton";
import { CurrencySelector } from "./CurrencySelector";

export const metadata = { title: "Account Settings — NetWorth Tracker" };

export default async function SettingsPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      currency: true,
      createdAt: true,
      _count: { select: { snapshots: true, categories: true } },
    },
  });

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar user={session.user} />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-800">Account Settings</h1>
          <p className="text-stone-400 text-sm mt-1">
            Manage your profile and data
          </p>
        </div>

        {/* Profile */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User size={16} className="text-stone-400" />
              Profile
            </CardTitle>
          </CardHeader>
          <div className="flex items-center gap-4">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name ?? "User"}
                width={60}
                height={60}
                className="rounded-2xl object-cover"
              />
            ) : (
              <div className="w-15 h-15 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xl w-[60px] h-[60px]">
                {user.name?.[0]?.toUpperCase() ?? "U"}
              </div>
            )}
            <div>
              <p className="font-semibold text-stone-800">{user.name}</p>
              <p className="text-sm text-stone-400">{user.email}</p>
              <p className="text-xs text-stone-400 mt-1">
                Member since {formatDate(user.createdAt)}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-stone-100 grid grid-cols-2 gap-4">
            <div className="bg-stone-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-stone-700">
                {user._count.snapshots}
              </p>
              <p className="text-xs text-stone-400">
                Snapshot{user._count.snapshots !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="bg-stone-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-stone-700">
                {user._count.categories}
              </p>
              <p className="text-xs text-stone-400">
                Categor{user._count.categories !== 1 ? "ies" : "y"}
              </p>
            </div>
          </div>
        </Card>

        {/* Authentication */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield size={16} className="text-stone-400" />
              Authentication
            </CardTitle>
          </CardHeader>
          <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
            <div className="flex-shrink-0">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                  <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                  <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                  <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
                  <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
                </g>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-stone-700">Google Account</p>
              <p className="text-xs text-stone-400">{user.email}</p>
            </div>
            <span className="ml-auto px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
              Connected
            </span>
          </div>
        </Card>

        {/* Preferences */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings size={16} className="text-stone-400" />
              Preferences
            </CardTitle>
          </CardHeader>
          <div>
            <p className="text-sm font-medium text-stone-700 mb-1">Currency</p>
            <p className="text-xs text-stone-400 mb-3">
              Choose the currency used to display all values across the app.
            </p>
            <CurrencySelector initialCurrency={user.currency ?? "INR"} />
          </div>
        </Card>

        {/* Data export */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download size={16} className="text-stone-400" />
              Export Data
            </CardTitle>
          </CardHeader>
          <p className="text-sm text-stone-500 mb-4">
            Download all your snapshot data as a CSV file. Includes full category and
            line item breakdowns for every snapshot.
          </p>
          <a
            href="/api/export"
            download
            className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 text-stone-700 text-sm font-medium rounded-xl hover:bg-stone-200 transition-colors"
          >
            <Download size={15} />
            Download CSV Export
          </a>
        </Card>

        {/* Danger zone */}
        <Card className="border-rose-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-rose-600">
              <Trash2 size={16} />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <p className="text-sm text-stone-500 mb-4">
            Permanently delete your account and all associated data including all
            snapshots, categories, and line items. This action cannot be undone.
          </p>
          <DeleteAccountButton />
        </Card>
      </main>
    </div>
  );
}
