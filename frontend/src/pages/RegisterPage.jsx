import { Link } from "react-router-dom";
import useAuthentication from "../hooks/useAuthentication";
import Icon from "../components/ui/Icon";

function RegisterPage() {
  const {
    registerFormData,
    error,
    loading,
    success,
    handleRegister,
    handleRegisterChange,
  } = useAuthentication();

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="auth-card">
          <Link className="auth-brand" to="/" aria-label="Planova home">
            <span className="auth-brand-mark">
              <Icon name="logo" />
            </span>
            Planova
          </Link>

          <p className="auth-eyebrow">Start planning softly</p>
          <h1>Create your travel space.</h1>
          <p className="auth-intro">
            One cosy home for every route, receipt, and travel companion.
          </p>

          <form className="auth-form" onSubmit={handleRegister}>
            <div className="form-field">
              <label htmlFor="register-name">Your name</label>
              <input
                id="register-name"
                type="text"
                name="name"
                value={registerFormData.name}
                onChange={handleRegisterChange}
                placeholder="How should we call you?"
                autoComplete="name"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="register-email">Email address</label>
              <input
                id="register-email"
                type="email"
                name="email"
                value={registerFormData.email}
                onChange={handleRegisterChange}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="register-password">Password</label>
              <input
                id="register-password"
                type="password"
                name="password"
                value={registerFormData.password}
                onChange={handleRegisterChange}
                placeholder="Choose a secure password"
                autoComplete="new-password"
                required
              />
            </div>

            {error && <p className="auth-alert auth-alert-error">{error}</p>}
            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading || Boolean(success)}
            >
              {loading ? "Creating your space..." : "Create account"}
              {!loading && <Icon name="arrowRight" size={17} />}
            </button>
          </form>

          {success && (
            <p className="auth-alert auth-alert-success">{success}</p>
          )}
          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </section>

      <aside className="auth-visual" aria-hidden="true">
        <span className="auth-orbit auth-orbit-one" />
        <span className="auth-orbit auth-orbit-two" />
        <div className="auth-visual-content">
          <span className="auth-visual-badge">
            <Icon name="sparkle" size={15} />
            Everything your trip needs
          </span>
          <h2>Plan together. Wander happier.</h2>
          <p>
            Invite your favourite people, organise every day, and let your
            little AI travel companion help along the way.
          </p>
          <div className="auth-postcard">
            <span className="auth-postcard-stamp">
              <Icon name="pin" />
            </span>
            <div className="auth-postcard-line" />
            <div className="auth-postcard-line" />
            <div className="auth-postcard-line" />
          </div>
        </div>
      </aside>
    </main>
  );
}

export default RegisterPage;
