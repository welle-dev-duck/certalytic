"use client";

import { Eye, Pencil, Plus } from "lucide-react";
import Link from "@/components/ui/link"

import { CreateTeamModal } from "@/components/layout/create-team-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { useAuth } from "@/providers/auth-provider";

export function TeamsList() {
  const { organizations } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Teams</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage your organizations and memberships
          </p>
        </div>
        <CreateTeamModal canCreateTeam={organizations.length < 5}>
          <Button size="sm">
            <Plus size={14} />
            New team
          </Button>
        </CreateTeamModal>
      </div>

      <div className="space-y-3">
        {organizations.map((org) => (
          <div
            key={org.id}
            className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{org.name}</span>
                {org.slug?.includes("personal") && (
                  <Badge variant="secondary">Personal</Badge>
                )}
              </div>
              <span className="text-sm text-muted-foreground">{org.slug}</span>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href={routes.settingsTeam(org.id)}>
                  <Pencil size={14} />
                  Edit
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href={routes.settingsTeam(org.id)}>
                  <Eye size={14} />
                  View
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
