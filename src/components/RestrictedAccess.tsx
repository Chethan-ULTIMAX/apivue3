import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { AppPage, getRoleLabel, pageLabels } from "@/lib/permissions";
import { PlatformRole } from "@/lib/types";

export function RestrictedAccess({ page, role }: { page: AppPage; role: PlatformRole }) {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <ShieldAlert className="h-6 w-6" />
      </div>
      <h1 className="text-lg font-semibold">Access restricted</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {getRoleLabel(role)} does not have access to {pageLabels[page].toLowerCase()}.
      </p>
      <Button className="mt-5" size="sm" onClick={() => navigate("/dashboard")}>Go to board</Button>
    </div>
  );
}
