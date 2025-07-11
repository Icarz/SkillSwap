// src/pages/Login.jsx
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Login failed");
        return;
      }

      // Save user and token in context
      login(data.user, data.token);
      navigate("/dashboard"); // 🔁 redirect on success
    } catch (err) {
      alert("Server error");
      console.error(err);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-[#0B2447] to-[#576CBC]">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm"
      >
        <h2 className="text-2xl font-bold mb-4 text-center text-[#19376D]">
          Login to SkillSwap
        </h2>
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 mb-3 border rounded-lg"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 mb-4 border rounded-lg"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-[#19376D] text-white py-2 rounded-lg hover:bg-[#0B2447]"
        >
          Login
        </button>
        <p className="p-5">Don't have an account? register here </p>
      </form>
    </div>
  );
};

export default Login;
