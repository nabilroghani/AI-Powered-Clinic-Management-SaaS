import { Link } from "react-router-dom";

const UnauthorizedPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-card max-w-xl rounded-[2rem] border border-white/60 p-10 text-center shadow-soft">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-clinic-600">
          Access Restricted
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900">
          You do not have permission to view this page.
        </h1>
        <p className="mt-4 text-slate-600">
          Your current role does not allow access to this area. Please return to your dashboard or
          sign in with an authorized account.
        </p>
        <Link
          to="/login"
          className="mt-8 inline-flex rounded-2xl bg-slateBlue px-5 py-3 text-sm font-semibold text-white"
        >
          Return to Login
        </Link>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
