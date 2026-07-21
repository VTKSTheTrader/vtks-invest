import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../services/authService";
import "./Register.css";

export default function Register() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!fullName || !email || !password || !confirmPassword) {
      return alert("Please fill all required fields.");
    }

    if (password !== confirmPassword) {
      return alert("Passwords do not match.");
    }

    if (password.length < 6) {
      return alert("Password should be at least 6 characters.");
    }

    try {
      setLoading(true);

      await registerUser({
        fullName,
        email,
        mobile,
        password,
      });

      alert("Registration successful!");

      navigate("/login");
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="register-page">
      <section className="register-card">

        <div className="register-brand">
          <span className="register-brand-vtks">VTKS</span>
          <span className="register-brand-hub">HUB</span>
        </div>

        <div className="register-heading">
          <span className="register-badge">
            🚀 Join VTKS Community
          </span>

          <h1>Create Account</h1>

          <p>
            Register to access VTKS indicators,
            scanners, portfolio tracking and premium
            educational resources.
          </p>
        </div>

        <form
          className="register-form"
          onSubmit={handleRegister}
        >

          <div className="register-field">
            <label>Full Name</label>

            <input
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) =>
                setFullName(e.target.value)
              }
            />
          </div>

          <div className="register-field">
            <label>Email Address</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />
          </div>

          <div className="register-field">
            <label>Mobile Number</label>

            <input
              placeholder="Enter mobile number"
              value={mobile}
              onChange={(e) =>
                setMobile(e.target.value)
              }
            />
          </div>

          <div className="register-field">
            <label>Password</label>

            <input
              type="password"
              placeholder="Create password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
            />
          </div>

          <div className="register-field">
            <label>Confirm Password</label>

            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
            />
          </div>

          <button
            className="register-submit-button"
            disabled={loading}
          >
            {loading
              ? "Creating Account..."
              : "Create Account"}
          </button>
        </form>

        <div className="register-links">
          Already have an account?
          <Link to="/login">
            Login
          </Link>
        </div>

      </section>
    </main>
  );
}