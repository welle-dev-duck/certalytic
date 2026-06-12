import { Form, Head, Link, usePage } from '@inertiajs/react';
import CandidateController from '@/actions/App/Http/Controllers/Candidates/CandidateController';
import AlertError from '@/components/alert-error';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { index } from '@/routes/candidates';
import type { TokenUsage } from '@/types/candidates';

type Props = {
    tokenUsage: TokenUsage;
    canCrossSource: boolean;
};

export default function CandidatesCreate({
    tokenUsage,
    canCrossSource,
}: Props) {
    const { currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';

    return (
        <>
            <Head title="New candidate" />

            <div className="mx-auto max-w-2xl space-y-6">
                <Heading
                    variant="small"
                    title="New candidate"
                    description={`${tokenUsage.available} token(s) available`}
                />

                <Form
                    {...CandidateController.store.form(teamSlug)}
                    encType="multipart/form-data"
                    className="space-y-4"
                >
                    {({ errors, processing }) => (
                        <>
                            {Object.keys(errors).length > 0 ? (
                                <AlertError
                                    errors={Object.values(errors).filter(Boolean) as string[]}
                                />
                            ) : null}

                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" name="name" required />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" type="email" />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="cv">CV (PDF)</Label>
                                <Input id="cv" name="cv" type="file" accept=".pdf" required />
                                <InputError message={errors.cv} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="transcript">Interview transcript</Label>
                                <textarea
                                    id="transcript"
                                    name="transcript"
                                    required
                                    rows={8}
                                    className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
                                />
                                <InputError message={errors.transcript} />
                            </div>

                            {canCrossSource ? (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                                        <Input id="linkedin_url" name="linkedin_url" type="url" />
                                        <InputError message={errors.linkedin_url} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="github_username">GitHub username</Label>
                                        <Input id="github_username" name="github_username" />
                                        <InputError message={errors.github_username} />
                                    </div>
                                </>
                            ) : null}

                            <div className="flex gap-2">
                                <Button type="submit" disabled={processing}>
                                    Start screening
                                </Button>
                                <Button variant="outline" asChild>
                                    <Link href={index(teamSlug)}>Cancel</Link>
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

CandidatesCreate.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'Candidates',
            href: props.currentTeam ? index(props.currentTeam.slug) : '/',
        },
        { title: 'New', href: '#' },
    ],
});
