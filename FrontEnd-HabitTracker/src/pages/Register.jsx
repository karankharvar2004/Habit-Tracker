import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import API from "../api/api";
import momentumLogo from "../assets/momentum-logo.svg";
import LoadingSpinner from "../components/LoadingSpinner";

function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await API.post("/auth/register", {
        username,
        email,
        password,
      });

      toast.success("Registration successful");
      navigate("/");
    } catch (error) {
      console.log(error);
      toast.error("Registration failed");
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
            <strong className="brand-lockup__title">Routines that grow into real progress.</strong>
          </div>
        </div>
        <p className="section-kicker">Start fresh</p>
        <h1>Create a focused routine that is easy to maintain.</h1>
        <p className="muted-text">
          Register once, then manage habits with filters, streak insights, and
          a clean mobile dashboard.
        </p>
      </section>

      <section className="auth-panel">
        <p className="section-kicker">Join Momentum</p>
        <h2>Register</h2>

        <form className="auth-form" onSubmit={handleRegister}>
          <label>
            <span>Username</span>
            <input
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </label>

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
              placeholder="Create a password"
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
            {isSubmitting ? (
              <LoadingSpinner label="Creating account..." />
            ) : (
              "Register"
            )}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/">Login</Link>
        </p>
      </section>
    </div>
  );
}

export default Register;
