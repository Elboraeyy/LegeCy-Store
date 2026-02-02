import VerifyEmailPageClient from './VerifyEmailPageClient';

export default async function VerifyEmailPage({
    searchParams
}: {
    searchParams: { token?: string; sent?: string; email?: string, error?: string }
}) {
    const { token, sent, email, error: errorParam } = await searchParams;

    return (
        <VerifyEmailPageClient
            token={token}
            sent={sent}
            email={email}
            error={errorParam}
        />
    );
}
