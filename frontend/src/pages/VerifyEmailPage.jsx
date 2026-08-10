import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { verifyEmail } from "../api/authenticationApi";
import Icon from "../components/ui/Icon";

function VerifyEmailPage() {
  const navigate = useNavigate();
  const verificationStarted = useRef(false);
  const token = new URLSearchParams(window.location.hash.slice(1)).get("token");
  const [error] = useState(() =>
    token ? "" : "This verification link is invalid or has expired."
  );

  useEffect(() => {
    if (verificationStarted.current) return;
    verificationStarted.current = true;

    if (!token) return;

    const completeVerification = async () => {
      try {
        await verifyEmail(token);
        navigate("/login?verified=true", { replace: true });
      } catch (requestError) {
        console.error("Error verifying email: ", requestError);
        navigate("/login?verification=invalid", { replace: true });
      }
    };

    completeVerification();
  }, [navigate, token]);

  return (
    <main className="auth-page auth-page-single">
      <section className="auth-panel">
        <div className="auth-card auth-verification-card">
          <Link className="auth-brand" to="/" aria-label="Planova home">
            <span className="auth-brand-mark">
              <Icon name="logo" />
            </span>
            Planova
          </Link>
          <p className="auth-eyebrow">Email verification</p>
          <h1>{error ? "We could not verify that link." : "Verifying your email..."}</h1>
          <p className={error ? "auth-alert auth-alert-error" : "auth-intro"}>
            {error || "This should only take a moment."}
          </p>
          {error && (
            <Link className="btn btn-primary" to="/login">
              Return to sign in
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}

export default VerifyEmailPage;
