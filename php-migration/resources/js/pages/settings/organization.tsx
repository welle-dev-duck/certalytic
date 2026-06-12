import { Form, Head, router } from '@inertiajs/react';
import { ChevronDown, Mail, UserPlus, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import CancelInvitationModal from '@/components/cancel-invitation-modal';
import DeleteTeamModal from '@/components/delete-team-modal';
import InputError from '@/components/input-error';
import InviteMemberModal from '@/components/invite-member-modal';
import RemoveMemberModal from '@/components/remove-member-modal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useInitials } from '@/hooks/use-initials';
import { dashboard as dashboardRoute } from '@/routes';
import { edit as organizationEdit } from '@/routes/organization';
import { update } from '@/routes/teams';
import { update as updateMember } from '@/routes/teams/members';
import type {
    RoleOption,
    Team,
    TeamInvitation,
    TeamMember,
    TeamPermissions,
} from '@/types';

type Props = {
    team: Team;
    members: TeamMember[];
    invitations: TeamInvitation[];
    permissions: TeamPermissions;
    availableRoles: RoleOption[];
};

function SectionHeader({ label }: { label: string }) {
    return (
        <p className="mb-4 text-[10px] font-bold tracking-widest text-muted-foreground">
            {label}
        </p>
    );
}

export default function OrganizationSettingsPage({
    team,
    members,
    invitations,
    permissions,
    availableRoles,
}: Props) {
    const getInitials = useInitials();

    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [removeMemberDialogOpen, setRemoveMemberDialogOpen] = useState(false);
    const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(
        null,
    );
    const [cancelInvitationDialogOpen, setCancelInvitationDialogOpen] =
        useState(false);
    const [invitationToCancel, setInvitationToCancel] =
        useState<TeamInvitation | null>(null);

    const pageTitle = useMemo(
        () =>
            permissions.canUpdateTeam
                ? `Edit ${team.name}`
                : `View ${team.name}`,
        [permissions.canUpdateTeam, team.name],
    );

    const updateMemberRole = (member: TeamMember, newRole: string) => {
        router.visit(updateMember([team.slug, member.id]), {
            data: { role: newRole },
            preserveScroll: true,
        });
    };

    const confirmRemoveMember = (member: TeamMember) => {
        setMemberToRemove(member);
        setRemoveMemberDialogOpen(true);
    };

    const confirmCancelInvitation = (invitation: TeamInvitation) => {
        setInvitationToCancel(invitation);
        setCancelInvitationDialogOpen(true);
    };

    return (
        <div className="space-y-8 p-6">
            <Head title="Organization Settings" />
            <h1 className="sr-only">{pageTitle}</h1>

            <div>
                <h1 className="text-xl font-bold text-foreground">
                    Organization Settings
                </h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                    {team.name} - workspace name, members, and invitations
                </p>
            </div>

            <section>
                <SectionHeader label="WORKSPACE" />
                {permissions.canUpdateTeam ? (
                    <Form
                        {...update.form(team.slug)}
                        className="space-y-4 rounded-lg border border-border bg-card p-5"
                    >
                        {({ errors, processing }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Team name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        data-test="team-name-input"
                                        defaultValue={team.name}
                                        required
                                    />
                                    <InputError message={errors.name} />
                                </div>
                                <Button
                                    type="submit"
                                    data-test="team-save-button"
                                    disabled={processing}
                                >
                                    Save
                                </Button>
                            </>
                        )}
                    </Form>
                ) : (
                    <div className="rounded-lg border border-border bg-card p-5">
                        <p className="text-sm font-semibold text-foreground">
                            {team.name}
                        </p>
                    </div>
                )}
            </section>

            <section>
                <div className="mb-4 flex items-center justify-between gap-4">
                    <p className="text-[10px] font-bold tracking-widest text-muted-foreground">
                        TEAM MEMBERS
                    </p>
                    {permissions.canCreateInvitation ? (
                        <Button
                            size="sm"
                            data-test="invite-member-button"
                            onClick={() => setInviteDialogOpen(true)}
                        >
                            <UserPlus size={14} />
                            Invite member
                        </Button>
                    ) : null}
                </div>

                <div className="space-y-3">
                    {members.map((member) => (
                        <div
                            key={member.id}
                            data-test="member-row"
                            className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
                        >
                            <div className="flex items-center gap-4">
                                <Avatar className="h-10 w-10">
                                    {member.avatar ? (
                                        <AvatarImage
                                            src={member.avatar}
                                            alt={member.name}
                                        />
                                    ) : null}
                                    <AvatarFallback>
                                        {getInitials(member.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-medium">
                                        {member.name}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {member.email}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {member.role !== 'owner' &&
                                permissions.canUpdateMember ? (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="cursor-pointer"
                                                data-test="member-role-trigger"
                                            >
                                                {member.role_label}
                                                <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            {availableRoles.map((role) => (
                                                <DropdownMenuItem
                                                    key={role.value}
                                                    className="cursor-pointer"
                                                    data-test="member-role-option"
                                                    onSelect={() =>
                                                        updateMemberRole(
                                                            member,
                                                            role.value,
                                                        )
                                                    }
                                                >
                                                    {role.label}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                ) : (
                                    <Badge variant="secondary">
                                        {member.role_label}
                                    </Badge>
                                )}

                                {member.role !== 'owner' &&
                                permissions.canRemoveMember ? (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="cursor-pointer"
                                                    data-test="member-remove-button"
                                                    onClick={() =>
                                                        confirmRemoveMember(
                                                            member,
                                                        )
                                                    }
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Remove member</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {invitations.length > 0 ? (
                <section>
                    <SectionHeader label="PENDING INVITATIONS" />
                    <div className="space-y-3">
                        {invitations.map((invitation) => (
                            <div
                                key={invitation.code}
                                data-test="invitation-row"
                                className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                        <Mail className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <div className="font-medium">
                                            {invitation.email}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {invitation.role_label}
                                        </div>
                                    </div>
                                </div>

                                {permissions.canCancelInvitation ? (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="cursor-pointer"
                                                    data-test="invitation-cancel-button"
                                                    onClick={() =>
                                                        confirmCancelInvitation(
                                                            invitation,
                                                        )
                                                    }
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Cancel invitation</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ) : null}
                            </div>
                        ))}
                    </div>
                </section>
            ) : null}

            {permissions.canDeleteTeam && !team.isPersonal ? (
                <section>
                    <SectionHeader label="DELETE WORKSPACE" />
                    <div className="space-y-4 rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-200/10 dark:bg-red-700/10">
                        <div className="relative space-y-0.5 text-red-600 dark:text-red-100">
                            <p className="font-medium">Warning</p>
                            <p className="text-sm">
                                Please proceed with caution, this cannot be
                                undone.
                            </p>
                        </div>
                        <Button
                            variant="destructive"
                            data-test="delete-team-button"
                            onClick={() => setDeleteDialogOpen(true)}
                        >
                            Delete team
                        </Button>
                    </div>
                </section>
            ) : null}

            {permissions.canCreateInvitation ? (
                <InviteMemberModal
                    team={team}
                    availableRoles={availableRoles}
                    open={inviteDialogOpen}
                    onOpenChange={setInviteDialogOpen}
                />
            ) : null}

            <RemoveMemberModal
                team={team}
                member={memberToRemove}
                open={removeMemberDialogOpen}
                onOpenChange={setRemoveMemberDialogOpen}
            />

            <CancelInvitationModal
                team={team}
                invitation={invitationToCancel}
                open={cancelInvitationDialogOpen}
                onOpenChange={setCancelInvitationDialogOpen}
            />

            {permissions.canDeleteTeam && !team.isPersonal ? (
                <DeleteTeamModal
                    team={team}
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                />
            ) : null}
        </div>
    );
}

OrganizationSettingsPage.layout = (props: {
    currentTeam?: { slug: string } | null;
}) => ({
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: props.currentTeam
                ? dashboardRoute.url(props.currentTeam.slug)
                : '/',
        },
        {
            title: 'Settings',
            href: organizationEdit.url(),
        },
    ],
});
