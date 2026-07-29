import {useState} from "react";
import { useNavigate,useLocation } from "react-router-dom";
import {registerUser, loginUser} from "../api/authenticationApi";

function useAuthentication() {
  const [loginFormData, setLoginFormData] = useState({email: "", password: ""});
  const [registerFormData, setRegisterFormData] = useState({name: "", email: "", password: ""});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleLogin = async(event) => {
    event.preventDefault();
    if (!loginFormData.email || !loginFormData.password) {
      setError("Email and password are required");
      return;
    }
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      const data = await loginUser(loginFormData);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setSuccess("Login successful!");
      setTimeout(() => {
        navigate(from, {replace: true});
      }, 1000);
    } catch (error) {
      console.error("Error logging in: ", error);
      setError("Login failed. Please check your details and try again.")
    } finally {
      setLoading(false);
    }
  };

  const handleLoginChange = (event) => {
    const { name, value } = event.target;
    setLoginFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    if (!registerFormData.email || !registerFormData.password || !registerFormData.name) {
      setError("Name, email and password are required");
      return;
    }
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      const data = await registerUser(registerFormData);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setSuccess("Account successfully registered!");
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (error) {
      console.error("Error registering in: ", error);
      setError("Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterChange = (event) => {
    const { name, value } = event.target;
    setRegisterFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleLogOut = () => {
    const confirmation = window.confirm("Are you sure you want to log out?");
    if (!confirmation) return;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setTimeout(() => {
      navigate("/login");
    }, 1000);
  };

  return { 
    loginFormData, setLoginFormData, registerFormData, setRegisterFormData, error, loading,
    success, setSuccess, handleLogin, handleLoginChange, handleRegister, handleRegisterChange, 
    handleLogOut
  };
}

export default useAuthentication;
