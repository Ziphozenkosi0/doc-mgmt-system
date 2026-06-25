import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { resetPassword } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setStatus("");
    setLoading(true);

    try {
      await resetPassword(email);
      setStatus("Check your inbox — we've sent a password reset link to that email.");
    } catch (err) {
      setError("Couldn't send reset email. Double-check the address and try again.");
    }

    setLoading(false);
  }

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-form">
        <h1>Reset password</h1>
        <p style={{ fontSize: 13, color: "#64748b", textAlign: "center", margin: "-8px 0 4px 0" }}>
          Enter your email and we'll send you a link to reset your password.
        </p>

        {error && <p className="error">{error}</p>}
        {status && <p className="status">{status}</p>}

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send reset link"}
        </button>

        <p>
          <Link to="/login">← Back to log in</Link>
        </p>
      </form>
    </div>
  );
}