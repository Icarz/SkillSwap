// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext"; // Import the new provider
import Login from "./pages/Login";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Navbar from "./components/Navbar";
import PrivateRoute from "./routes/PrivateRoute";
import ExploreSkills from "./pages/ExploreSkills";
import ExploreUsers from "./pages/ExploreUsers";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import Transactions from "./pages/Transactions";
import Footer from "./components/Footer";

function App() {
  return (
    <AuthProvider>
      {/* Wrap your app with SocketProvider */}
      <SocketProvider>
        <Router>
          <Navbar />
          <Routes>
            {/* public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile/:userId" element={<Profile />} />
            <Route path="/explore-skills" element={<ExploreSkills />} />
            <Route path="/explore-users" element={<ExploreUsers />} />
            
            {/* Private Routes */}
            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/transactions" element={<Transactions />} />
            </Route>
          </Routes>
          <Footer />
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;