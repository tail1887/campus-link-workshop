"use client";

import { ProfileShellView } from "@/components/profile-shell-view";
import { buildProfileShellViewModel } from "@/lib/profile-shell/adapter";

export default function UserProfileShellPage() {
  const model = buildProfileShellViewModel("student");

  return <ProfileShellView model={model} />;
}
