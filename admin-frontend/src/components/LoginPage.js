// import React, { useState } from "react";
// import { api } from "../api";

// function LoginPage({ onLoginSuccess }) {
//   const [username, setUsername] = useState("admin");
//   const [password, setPassword] = useState("admin123");
//   const [error, setError] = useState("");

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");

//     try {
//       const res = await api.post("/admin/login", {
//         username,
//         password,
//       });
//       const token = res.data.token;
//       localStorage.setItem("adminToken", token);
//       onLoginSuccess();
//     } catch (err) {
//       console.error(err);
//       setError("Invalid credentials");
//     }
//   };

//   return (
//     <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>
//       <form
//         onSubmit={handleSubmit}
//         style={{
//           border: "1px solid #ccc",
//           padding: 24,
//           borderRadius: 8,
//           minWidth: 300,
//         }}
//       >
//         <h2>Admin Login</h2>
//         <div style={{ marginBottom: 12 }}>
//           <label>Username</label>
//           <input
//             style={{ width: "100%" }}
//             value={username}
//             onChange={(e) => setUsername(e.target.value)}
//           />
//         </div>
//         <div style={{ marginBottom: 12 }}>
//           <label>Password</label>
//           <input
//             style={{ width: "100%" }}
//             type="password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//           />
//         </div>
//         {error && <p style={{ color: "red" }}>{error}</p>}
//         <button type="submit" style={{ width: "100%", padding: 8 }}>
//           Login
//         </button>
//       </form>
//     </div>
//   );
// }

// export default LoginPage;



import React, { useState } from "react";
import { api } from "../api";

function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

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
      setError("Invalid credentials. Please check your username and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">
              <img 
                src="https://lotofhappysmiles.com/Images/Logos/mainlogo.png" 
                alt="Company Logo" 
                className="logo-image"
              />
            </div>
            <h1>Admin Portal</h1>
            <p className="login-subtitle">Sign in to access your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button 
              type="submit" 
              className="login-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Signing In...
                </>
              ) : (
                "Sign In to Dashboard"
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>Secure Admin Access • v2.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;