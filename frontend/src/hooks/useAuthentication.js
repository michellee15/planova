import {useState} from "react";
import { useNavigate,useLocation } from "react-router-dom";
import {
  registerUser,
  loginUser,
  resendVerificationEmail,
} from "../api/authenticationApi";
import { useConfirmDialog } from "../components/ui/confirmDialogContext";

function useAuthentication() {
  const confirm = useConfirmDialog();
  const [loginFormData, setLoginFormData] = useState({email: "", password: ""});
  const [registerFormData, setRegisterFormData] = useState({name: "", email: "", password: ""});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const verificationStatus = new URLSearchParams(location.search).get(
    "verified"
  );
  const verificationError = new URLSearchParams(location.search).get(
    "verification"
  );
  const [success, setSuccess] = useState(
    verificationStatus === "true"
      ? "Email verified. You can now sign in."
      : ""
  );
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
      if (responseData?.code === "EMAIL_NOT_VERIFIED") {
        setVerificationEmail(responseData.email || loginFormData.email);
        setError(responseData.message);
      } else {
        setError(
          responseData?.message ||
            "Login failed. Please check your details and try again."
        );
      }
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
      setVerificationEmail(data.user.email);
      setSuccess(data.message);
    } catch (error) {
      console.error("Error registering in: ", error);
      const responseData = error.response?.data;
      if (responseData?.code === "VERIFICATION_EMAIL_FAILED") {
        setVerificationEmail(responseData.email);
      }
      setError(responseData?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    const email = verificationEmail || loginFormData.email || registerFormData.email;
    if (!email) return;

    try {
      setResendLoading(true);
      setError("");
      const data = await resendVerificationEmail(email);
      setSuccess(data.message);
    } catch (error) {
      console.error("Error resending verification email: ", error);
      setError(
        error.response?.data?.message ||
          "The verification email could not be requested. Please try again."
      );
    } finally {
      setResendLoading(false);
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
    success, setSuccess, verificationEmail, resendLoading, verificationError,
    handleLogin, handleLoginChange, handleRegister, handleRegisterChange,
    handleResendVerification, handleLogOut
  };
}

export default useAuthentication;
