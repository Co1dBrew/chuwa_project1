// AuthForm powers the signin, signup, and updatePassword pages; the "mode" prop
// selects which fields, button text, and validation rules to show.

import { Alert, Button, Form, Input, Radio } from "antd";
import type { FormItemProps } from "antd";
import type { ReactNode } from "react";
import type { UserRole } from "../../types/user";
import { MIN_PASSWORD_LENGTH, isValidEmail } from "../../utils/validation";

export type AuthMode = "signin" | "signup" | "updatePassword";

// Every field the form can collect; each mode uses only some of them.
export interface AuthFormValues {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  currentPassword?: string;
  newPassword?: string;
  role?: UserRole;
}

interface AuthFormProps {
  mode: AuthMode;
  onSubmit: (values: AuthFormValues) => void;
  loading: boolean;
  error: string | null;
  title: string;
  footer?: ReactNode;
}

function AuthForm({ mode, onSubmit, loading, error, title, footer }: AuthFormProps) {
  // Which fields this mode should display. The backend logs in by username, so
  // sign in collects a username (not an email); email is only for sign up.
  const showUsername = mode === "signin" || mode === "signup";
  const showEmail = mode === "signup";
  const showPassword = mode === "signin" || mode === "signup";
  const showCurrentPassword = mode === "updatePassword";
  const showNewPassword = mode === "updatePassword";
  const showConfirmPassword = mode === "signup" || mode === "updatePassword";
  const showRole = mode === "signup";

  // When confirming a password, which field must it match?
  const passwordFieldToMatch = mode === "signup" ? "password" : "newPassword";

  // Sign up also enforces a minimum length; sign in just needs a value.
  const passwordRules: NonNullable<FormItemProps["rules"]> = [
    { required: true, message: "Please enter your password." },
  ];
  if (mode === "signup") {
    passwordRules.push({
      min: MIN_PASSWORD_LENGTH,
      message: "Password must be at least " + MIN_PASSWORD_LENGTH + " characters.",
    });
  }

  // Sign up enforces the backend's username format (3–20 letters/digits).
  const usernameRules: NonNullable<FormItemProps["rules"]> = [
    { required: true, message: "Please enter a username." },
  ];
  if (mode === "signup") {
    usernameRules.push({
      pattern: /^[A-Za-z0-9]{3,20}$/,
      message: "Username must be 3–20 letters or digits.",
    });
  }

  // Button text depends on the mode and whether a request is running.
  let submitText = "Submit";
  if (mode === "signin") {
    submitText = loading ? "Signing in..." : "Sign in";
  } else if (mode === "signup") {
    submitText = loading ? "Creating account..." : "Create account";
  } else if (mode === "updatePassword") {
    submitText = loading ? "Updating..." : "Update password";
  }

  function handleFinish(values: AuthFormValues) {
    onSubmit(values);
  }

  return (
    <div style={{ maxWidth: 420, margin: "0 auto" }}>
      <h1 style={{ textAlign: "center", marginBottom: 24 }}>{title}</h1>

      {error !== null ? (
        <Alert
          type="error"
          message={error}
          showIcon
          style={{ marginBottom: 16 }}
        />
      ) : null}

      <Form layout="vertical" onFinish={handleFinish} requiredMark={false}>
        {showUsername ? (
          <Form.Item label="Username" name="username" rules={usernameRules}>
            <Input placeholder="Your username" autoComplete="username" />
          </Form.Item>
        ) : null}

        {showEmail ? (
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Please enter your email." },
              {
                validator(_rule, value) {
                  // Let the "required" rule handle an empty value.
                  if (!value || isValidEmail(value)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Please enter a valid email address."),
                  );
                },
              },
            ]}
          >
            <Input placeholder="you@example.com" autoComplete="email" />
          </Form.Item>
        ) : null}

        {showPassword ? (
          <Form.Item label="Password" name="password" rules={passwordRules}>
            <Input.Password placeholder="Password" autoComplete="current-password" />
          </Form.Item>
        ) : null}

        {showCurrentPassword ? (
          <Form.Item
            label="Current password"
            name="currentPassword"
            rules={[
              { required: true, message: "Please enter your current password." },
            ]}
          >
            <Input.Password placeholder="Current password" />
          </Form.Item>
        ) : null}

        {showNewPassword ? (
          <Form.Item
            label="New password"
            name="newPassword"
            rules={[
              { required: true, message: "Please enter a new password." },
              {
                min: MIN_PASSWORD_LENGTH,
                message:
                  "Password must be at least " + MIN_PASSWORD_LENGTH + " characters.",
              },
              // The new password must differ from the current one.
              function ({ getFieldValue }) {
                return {
                  validator(_rule, value) {
                    if (!value || getFieldValue("currentPassword") !== value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("The new password must be different."),
                    );
                  },
                };
              },
            ]}
          >
            <Input.Password placeholder="New password" />
          </Form.Item>
        ) : null}

        {showConfirmPassword ? (
          <Form.Item
            label="Confirm password"
            name="confirmPassword"
            // Re-run validation when the matched password field changes.
            dependencies={[passwordFieldToMatch]}
            rules={[
              { required: true, message: "Please confirm your password." },
              // This value must equal the password it confirms.
              function ({ getFieldValue }) {
                return {
                  validator(_rule, value) {
                    if (!value || getFieldValue(passwordFieldToMatch) === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("The two passwords do not match."),
                    );
                  },
                };
              },
            ]}
          >
            <Input.Password placeholder="Re-enter password" />
          </Form.Item>
        ) : null}

        {showRole ? (
          <Form.Item label="Account type" name="role" initialValue="customer">
            <Radio.Group>
              <Radio value="customer">Customer</Radio>
              <Radio value="merchant">Merchant</Radio>
            </Radio.Group>
          </Form.Item>
        ) : null}

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={loading}
          >
            {submitText}
          </Button>
        </Form.Item>
      </Form>

      {footer !== undefined ? (
        <div style={{ textAlign: "center" }}>{footer}</div>
      ) : null}
    </div>
  );
}

export default AuthForm;
