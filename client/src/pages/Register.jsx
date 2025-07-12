// src/pages/Register.jsx
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      // Auto-login after registration
      login(data.user, data.token);
      navigate("/dashboard");
    } catch (err) {
      alert("Server error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-[#0B2447] to-[#576CBC]">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm"
      >
        <h2 className="text-2xl font-bold mb-4 text-center text-[#19376D]">
          Create your  account
        </h2>
        <input
          type="text"
          placeholder="Name"
          className="w-full p-2 mb-3 border rounded-lg"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
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
          disabled={loading}
        >
          {loading ? "Registering..." : "Register"}
        </button>
        <p className="p-5 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-accent hover:underline font-semibold">
            Login here
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Register;