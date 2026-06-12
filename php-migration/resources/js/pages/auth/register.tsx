import { Form, Head } from '@inertiajs/react';
import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register';
import { registerSchema } from '@/lib/validation/auth';
import { firstZodError } from '@/lib/validation/helpers';

type Props = {
    passwordRules: string;
};

export default function Register({ passwordRules }: Props) {
    const [consents, setConsents] = useState({
        terms: false,
        privacy: false,
        dpa: false,
    });

    return (
        <>
            <Head title="Register" />
            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6"
                onSubmit={(event) => {
                    const formData = new FormData(event.currentTarget);
                    const parsed = registerSchema.safeParse({
                        name: formData.get('name'),
                        email: formData.get('email'),
                        password: formData.get('password'),
                        password_confirmation: formData.get(
                            'password_confirmation',
                        ),
                        accept_terms: formData.get('accept_terms'),
                        accept_privacy: formData.get('accept_privacy'),
                        accept_dpa: formData.get('accept_dpa'),
                    });

                    if (!parsed.success) {
                        event.preventDefault();
                        toast.error(firstZodError(parsed.error));
                    }
                }}
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    name="name"
                                    placeholder="Full name"
                                />
                                <InputError
                                    message={errors.name}
                                    className="mt-2"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={2}
                                    autoComplete="email"
                                    name="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <PasswordInput
                                    id="password"
                                    required
                                    tabIndex={3}
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder="Password"
                                    passwordrules={passwordRules}
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">
                                    Confirm password
                                </Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    required
                                    tabIndex={4}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder="Confirm password"
                                    passwordrules={passwordRules}
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>

                            <div className="space-y-3 rounded-md border border-border bg-muted/20 p-4">
                                <ConsentRow
                                    id="accept_terms"
                                    name="accept_terms"
                                    checked={consents.terms}
                                    onCheckedChange={(checked) =>
                                        setConsents((current) => ({
                                            ...current,
                                            terms: checked,
                                        }))
                                    }
                                    error={errors.accept_terms}
                                    tabIndex={5}
                                >
                                    I accept the{' '}
                                    <TextLink
                                        href="/legal/terms"
                                        target="_blank"
                                        tabIndex={-1}
                                    >
                                        Terms of Service
                                    </TextLink>
                                </ConsentRow>
                                <ConsentRow
                                    id="accept_privacy"
                                    name="accept_privacy"
                                    checked={consents.privacy}
                                    onCheckedChange={(checked) =>
                                        setConsents((current) => ({
                                            ...current,
                                            privacy: checked,
                                        }))
                                    }
                                    error={errors.accept_privacy}
                                    tabIndex={6}
                                >
                                    I accept the{' '}
                                    <TextLink
                                        href="/legal/privacy"
                                        target="_blank"
                                        tabIndex={-1}
                                    >
                                        Privacy Policy
                                    </TextLink>
                                </ConsentRow>
                                <ConsentRow
                                    id="accept_dpa"
                                    name="accept_dpa"
                                    checked={consents.dpa}
                                    onCheckedChange={(checked) =>
                                        setConsents((current) => ({
                                            ...current,
                                            dpa: checked,
                                        }))
                                    }
                                    error={errors.accept_dpa}
                                    tabIndex={7}
                                >
                                    I accept the{' '}
                                    <TextLink
                                        href="/legal/dpa"
                                        target="_blank"
                                        tabIndex={-1}
                                    >
                                        Data Processing Agreement (DPA)
                                    </TextLink>
                                </ConsentRow>
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 w-full"
                                tabIndex={8}
                                data-test="register-user-button"
                            >
                                {processing && <Spinner />}
                                Create account
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <TextLink href={login()} tabIndex={9}>
                                Log in
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

function ConsentRow({
    id,
    name,
    checked,
    onCheckedChange,
    error,
    tabIndex,
    children,
}: {
    id: string;
    name: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    error?: string;
    tabIndex: number;
    children: ReactNode;
}) {
    return (
        <div className="space-y-1">
            <div className="flex items-start gap-3">
                <Checkbox
                    id={id}
                    checked={checked}
                    onCheckedChange={(value) =>
                        onCheckedChange(value === true)
                    }
                    tabIndex={tabIndex}
                />
                <input
                    type="hidden"
                    name={name}
                    value={checked ? '1' : ''}
                />
                <Label
                    htmlFor={id}
                    className="text-sm leading-relaxed font-normal text-muted-foreground"
                >
                    {children}
                </Label>
            </div>
            <InputError message={error} className="ml-7" />
        </div>
    );
}

Register.layout = {
    title: 'Create an account',
    description: 'Enter your details below to create your account',
};
