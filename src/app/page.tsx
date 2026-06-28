import { FamilyTreeApp } from "@/components/FamilyTreeApp";
import { SetupScreen } from "@/components/SetupScreen";

export const dynamic = "force-dynamic";

export default function Home() {
  const isConfigured = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {isConfigured ? <FamilyTreeApp /> : <SetupScreen />}
    </div>
  );
}
