import type { Metadata } from "next";
import { AccountView } from "./AccountView";

export const metadata: Metadata = { title: "Cuenta" };

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-xl space-y-5">
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-brand-800">Cuenta</h1>
      <AccountView />
    </div>
  );
}
