"use client";

import { ProfileShellView } from "@/components/profile-shell-view";
import { buildProfileShellViewModel } from "@/lib/profile-shell/adapter";

export default function AdminProfileShellPage() {
  const model = buildProfileShellViewModel("admin");

  return <ProfileShellView model={model} />;
}
