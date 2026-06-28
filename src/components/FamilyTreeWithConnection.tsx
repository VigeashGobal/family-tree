"use client";

import { ConvexConnectionStatus } from "@/components/ConvexConnectionStatus";
import { FamilyTreeApp } from "@/components/FamilyTreeApp";

export function FamilyTreeWithConnection() {
  return (
    <ConvexConnectionStatus>
      <FamilyTreeApp />
    </ConvexConnectionStatus>
  );
}
