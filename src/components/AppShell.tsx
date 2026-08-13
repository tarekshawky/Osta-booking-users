import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-bg">
      <div className="flex flex-1 flex-col">{children}</div>
      <BottomNav />
    </div>
  );
}
