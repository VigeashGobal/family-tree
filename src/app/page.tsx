import { FamilyTreeWithConnection } from "@/components/FamilyTreeWithConnection";
import { SetupScreen } from "@/components/SetupScreen";

export const dynamic = "force-dynamic";

export default function Home() {
  const isConfigured = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

  return (
    <div className="flex min-h-full flex-col">
      {isConfigured ? <FamilyTreeWithConnection /> : <SetupScreen />}
    </div>
  );
}
