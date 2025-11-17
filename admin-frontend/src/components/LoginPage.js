import React, { useState } from "react";
import { api } from "../api";

function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("/admin/login", {
        username,
        password,
      });
      const token = res.data.token;
      localStorage.setItem("adminToken", token);
      onLoginSuccess();
    } catch (err) {
      console.error(err);
      setError("Invalid credentials");
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>
      <form
        onSubmit={handleSubmit}
        style={{
          border: "1px solid #ccc",
          padding: 24,
          borderRadius: 8,
          minWidth: 300,
        }}
      >
        <h2>Admin Login</h2>
        <div style={{ marginBottom: 12 }}>
          <label>Username</label>
          <input
            style={{ width: "100%" }}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Password</label>
          <input
            style={{ width: "100%" }}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" style={{ width: "100%", padding: 8 }}>
          Login
        </button>
      </form>
    </div>
  );
}

export default LoginPage;
