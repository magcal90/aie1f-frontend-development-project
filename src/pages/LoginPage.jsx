// src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { USERS } from "../../data/users";
import kakeiboLogo from "../assets/kakeibo.png";
import styles from "./LoginPage.module.css";

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    const match = USERS.find(
      (u) => u.email === email && u.password === password,
    );
    if (match) {
      const userData = { ...match };
      delete userData.password;
      login(userData);
      // Go back to the page the visitor was trying to reach, or the app's home
      const from = location.state?.from?.pathname || "/app";
      navigate(from, { replace: true });
    } else {
      setError("Incorrect email or password.");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <img className={styles.logoMark} src={kakeiboLogo} alt="Kakeibo" />
        </div>

        <h1 className={styles.heading}>Sign in</h1>
        <p className={styles.lead}>Welcome back to Kakeibo (かけいぼ) — Personal Finance Tracker.</p>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@team3.io"
              required
              autoFocus
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className={styles.submitBtn}>
            Sign in
          </button>
        </form>

        <p className={styles.hint}>
          Try: victor@team3.io / password123
        </p>
      </div>
    </div>
  );
}

export default LoginPage;