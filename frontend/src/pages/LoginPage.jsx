import { Link } from "react-router-dom";
import useAuthentication from "../hooks/useAuthentication";
import Icon from "../components/ui/Icon";

function AuthVisual() {
  return (
    <aside className="auth-visual" aria-hidden="true">
      <span className="auth-orbit auth-orbit-one" />
      <span className="auth-orbit auth-orbit-two" />
      <div className="auth-visual-content">
        <span className="auth-visual-badge">
          <Icon name="sparkle" size={15} />
          Your thoughtful travel space
        </span>
        <h2>Little plans become lovely memories.</h2>
        <p>
          Keep your itinerary, shared expenses, and favourite trip moments
          together—without the travel-planning clutter.
        </p>
        <div className="auth-postcard">
          <span className="auth-postcard-stamp">
            <Icon name="map" />
          </span>
          <div className="auth-postcard-line" />
          <div className="auth-postcard-line" />
          <div className="auth-postcard-line" />
        </div>
      </div>
    </aside>
  );
}

function LoginPage() {
  const {
    loginFormData,
    error,
    loading,
    success,
    handleLogin,
    handleLoginChange,
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

          <p className="auth-eyebrow">Welcome back</p>
          <h1>Ready for your next adventure?</h1>
          <p className="auth-intro">
            Sign in to pick up where your plans left off.
          </p>

          <form className="auth-form" onSubmit={handleLogin}>
            <div className="form-field">
              <label htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                type="email"
                name="email"
                value={loginFormData.email}
                onChange={handleLoginChange}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                name="password"
                value={loginFormData.password}
                onChange={handleLoginChange}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </div>

            {error && <p className="auth-alert auth-alert-error">{error}</p>}
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Signing you in..." : "Sign in"}
              {!loading && <Icon name="arrowRight" size={17} />}
            </button>
          </form>

          {success && (
            <p className="auth-alert auth-alert-success">{success}</p>
          )}
          <p className="auth-switch">
            New to Planova? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </section>
      <AuthVisual />
    </main>
  );
}

export default LoginPage;
