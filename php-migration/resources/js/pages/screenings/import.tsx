import { Form, Head, Link, usePage } from '@inertiajs/react';
import BulkImportController from '@/actions/App/Http/Controllers/Candidates/BulkImportController';
import AlertError from '@/components/alert-error';
import Heading from '@/components/heading';
import FileDropzone from '@/components/file-dropzone';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { index } from '@/routes/candidates';
import type { TokenUsage } from '@/types/candidates';

type Props = {
    tokenUsage: TokenUsage;
};

export default function ScreeningsImport({ tokenUsage }: Props) {
    const { currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';

    return (
        <>
            <Head title="Import screenings" />

            <div className="mx-auto max-w-2xl space-y-6 p-5 md:p-8">
                <Heading
                    title="Bulk import"
                    description={`CSV or multi-file upload · ${tokenUsage.available} token(s) available`}
                />

                <div className="surface-panel p-6">
                    <Form
                        {...BulkImportController.store.form(teamSlug)}
                        encType="multipart/form-data"
                        className="space-y-4"
                    >
                        {({ errors, processing }) => (
                            <>
                                {Object.keys(errors).length > 0 ? (
                                    <AlertError
                                        errors={Object.values(errors).filter(
                                            Boolean,
                                        ) as string[]}
                                    />
                                ) : null}

                                <div className="grid gap-2">
                                    <Label htmlFor="csv">CSV file</Label>
                                    <FileDropzone
                                        id="csv"
                                        name="csv"
                                        accept=".csv,.txt"
                                        description="CSV or TXT - or click to browse"
                                        aria-invalid={Boolean(errors.csv)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Columns: name, email, transcript (optional)
                                    </p>
                                    <InputError message={errors.csv} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="cvs">CV PDFs (multi-file)</Label>
                                    <FileDropzone
                                        id="cvs"
                                        name="cvs[]"
                                        accept=".pdf"
                                        multiple
                                        description="Select one or more PDFs - or drop them here"
                                        aria-invalid={Boolean(errors.cvs)}
                                    />
                                    <InputError message={errors.cvs} />
                                </div>

                                <div className="flex gap-2">
                                    <Button type="submit" variant="brand" disabled={processing}>
                                        Import
                                    </Button>
                                    <Button variant="outline" asChild>
                                        <Link href={index(teamSlug)}>Cancel</Link>
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                </div>
            </div>
        </>
    );
}

ScreeningsImport.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'Screenings',
            href: props.currentTeam ? index(props.currentTeam.slug) : '/',
        },
        { title: 'Import', href: '#' },
    ],
});
