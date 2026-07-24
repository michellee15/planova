import { Link } from "react-router-dom";
import useAuthentication from "../hooks/useAuthentication";

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
    <main>
      <section>
        <h1>Create your Planova account</h1>
        <p>Save your trips, expenses, and itinerary under your own account.</p>

        <form onSubmit={handleRegister}>
          <input
            type="text"
            name="name"
            value={registerFormData.name}
            onChange={handleRegisterChange}
            placeholder="Name"
          />

          <input
            type="email"
            name="email"
            value={registerFormData.email}
            onChange={handleRegisterChange}
            placeholder="Email"
          />

          <input
            type="password"
            name="password"
            value={registerFormData.password}
            onChange={handleRegisterChange}
            placeholder="Password"
          />

          {error && <p>{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>
        {success && <p>{success}</p>}
        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </section>
    </main>
  );
}

export default RegisterPage;