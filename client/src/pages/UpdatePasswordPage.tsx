// Renders AuthForm in "updatePassword" mode. The backend has no password-change
// endpoint yet, so this page is kept for the demo but simply informs the user
// that the feature is not available instead of calling the backend.

import { message } from "antd";
import AuthForm from "../components/auth/AuthForm";
import type { AuthFormValues } from "../components/auth/AuthForm";

function UpdatePasswordPage() {
  function handleSubmit(_values: AuthFormValues) {
    message.info("Password change is not available yet.");
  }

  return (
    <AuthForm
      mode="updatePassword"
      title="Update password"
      loading={false}
      error={null}
      onSubmit={handleSubmit}
    />
  );
}

export default UpdatePasswordPage;
