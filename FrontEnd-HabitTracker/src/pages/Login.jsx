import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import API from "../api/api";
import momentumLogo from "../assets/momentum-logo.svg";
import LoadingSpinner from "../components/LoadingSpinner";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await API.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("access_token", response.data.access_token);
      localStorage.setItem("refresh_token", response.data.refresh_token);

      toast.success("Login successful");
      navigate("/dashboard");
    } catch (error) {
      console.log(error);
      toast.error("Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <section className="auth-panel auth-panel--feature">
        <div className="brand-lockup brand-lockup--auth">
          <img className="brand-lockup__logo" src={momentumLogo} alt="Momentum logo" />
          <div>
            <p className="section-kicker">Momentum</p>
            <strong className="brand-lockup__title">Daily progress that keeps moving.</strong>
          </div>
        </div>
        <p className="section-kicker">Build momentum</p>
        <h1>Track habits with a dashboard that feels alive.</h1>
        <p className="muted-text">
          See streaks, progress, charts, and calendar activity in one place.
        </p>
        <div className="auth-feature-pills">
          <span>Daily streaks</span>
          <span>Progress bars</span>
          <span>Calendar insights</span>
        </div>
      </section>

      <section className="auth-panel">
        <p className="section-kicker">Welcome back to Momentum</p>
        <h2>Login</h2>

        <form className="auth-form" onSubmit={handleLogin}>
          <label>
            <span>Email</span>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <button
            type="submit"
            className="primary-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? <LoadingSpinner label="Signing in..." /> : "Login"}
          </button>
        </form>

        <p className="auth-footer">
          Need an account? <Link to="/register">Create one</Link>
        </p>
      </section>
    </div>
  );
}

export default Login;
