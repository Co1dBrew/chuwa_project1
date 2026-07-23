import { useState } from "react";
import { message } from "antd";
import { useNavigate } from "react-router-dom";
import AuthForm from "../components/auth/AuthForm";
import type { AuthFormValues } from "../components/auth/AuthForm";
import { changePassword } from "../services/authService";

function UpdatePasswordPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: AuthFormValues) {
    if (!values.currentPassword || !values.newPassword) return;

    setLoading(true);
    setError(null);
    try {
      await changePassword(values.currentPassword, values.newPassword);
      message.success("Password updated.");
      navigate("/products");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not update password.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthForm
      mode="updatePassword"
      title="Update password"
      loading={loading}
      error={error}
      onSubmit={handleSubmit}
    />
  );
}

export default UpdatePasswordPage;
