import { LoginForm } from './LoginForm';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="mx-auto max-w-md py-16">
      <h1 className="mb-2 text-2xl font-bold text-neutral-900">Roomly Admin</h1>
      <p className="mb-8 text-sm text-neutral-500">
        Staff sign-in (admin or moderator accounts only).
      </p>
      <LoginForm staffError={params.error === 'staff_required'} />
    </div>
  );
}
