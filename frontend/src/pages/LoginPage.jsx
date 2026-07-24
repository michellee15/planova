import { Link } from "react-router-dom";
import useAuthentication from "../hooks/useAuthentication";

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
    <main>
      <section>
        <h1>Login to Planova</h1>
        <p>Access your trips, expenses, and itinerary.</p>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            name="email"
            value={loginFormData.email}
            onChange={handleLoginChange}
            placeholder="Email"
          />

          <input
            type="password"
            name="password"
            value={loginFormData.password}
            onChange={handleLoginChange}
            placeholder="Password"
          />

          {error && <p>{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        {success && <p>{success}</p>}
        <p>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </section>
    </main>
  );
}

export default LoginPage;

