import {useState} from "react";
import { useNavigate,useLocation } from "react-router-dom";
import {
  registerUser,
  loginUser,
} from "../api/authenticationApi";
import { useConfirmDialog } from "../components/ui/confirmDialogContext";

function useAuthentication() {
  const confirm = useConfirmDialog();
  const [loginFormData, setLoginFormData] = useState({email: "", password: ""});
  const [registerFormData, setRegisterFormData] = useState({name: "", email: "", password: ""});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [success, setSuccess] = useState("");
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
      const responseData = error.response?.data;
      setError(
        responseData?.message ||
          "Login failed. Please check your details and try again."
      );
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
      await registerUser(registerFormData);
      setSuccess("Sign-up successful. Please sign in to continue.");
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1200);
    } catch (error) {
      console.error("Error registering in: ", error);
      const responseData = error.response?.data;
      setError(responseData?.message || "Registration failed.");
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

  const handleLogOut = async () => {
    const confirmation = await confirm({
      title: "Log out of Planova?",
      description:
        "Your saved trips will stay safe and you can sign back in at any time.",
      confirmLabel: "Log out",
    });
    if (!confirmation) return;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setTimeout(() => {
      navigate("/login");
    }, 1000);
  };

  return { 
    loginFormData, setLoginFormData, registerFormData, setRegisterFormData, error, loading,
    success, setSuccess,
    handleLogin, handleLoginChange, handleRegister, handleRegisterChange,
    handleLogOut
  };
}

export default useAuthentication;
