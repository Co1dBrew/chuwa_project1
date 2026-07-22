/*
 * AuthForm: ONE form component that powers all three authentication pages.
 *
 * The "mode" prop decides which fields, which button text, and which validation
 * rules to show:
 *   - mode="signin"         -> email + password
 *   - mode="signup"         -> username + email + password + confirm password
 *   - mode="updatePassword" -> current password + new password + confirm password
 *
 * WHY ONE COMPONENT INSTEAD OF THREE:
 * The three forms share almost all of their layout, styling, error handling and
 * validation. Writing them once and switching on "mode" means less duplicated
 * code and one place to fix bugs. The page components stay tiny: they just pass
 * a mode and an onSubmit function, and decide what to do with the values.
 */

import { Alert, Button, Form, Input } from "antd";
import type { FormItemProps } from "antd";
import type { ReactNode } from "react";
import { MIN_PASSWORD_LENGTH, isValidEmail } from "../../utils/validation";

/** The mode chooses which "face" the form wears. */
export type AuthMode = "signin" | "signup" | "updatePassword";

/**
 * Every possible field the form can collect. Each is optional because any given
 * mode only uses some of them. The page reads the fields it needs.
 */
export interface AuthFormValues {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  currentPassword?: string;
  newPassword?: string;
}

interface AuthFormProps {
  mode: AuthMode;
  /** Called with the entered values after they pass validation. */
  onSubmit: (values: AuthFormValues) => void;
  /** true while the request is running, so we can disable the button. */
  loading: boolean;
  /** An error message to show above the form, or null for none. */
  error: string | null;
  /** A heading shown at the top of the form. */
  title: string;
  /** Optional links shown under the button (e.g. "Don't have an account?"). */
  footer?: ReactNode;
}

function AuthForm({ mode, onSubmit, loading, error, title, footer }: AuthFormProps) {
  // Work out which fields this mode should display.
  const showUsername = mode === "signup";
  const showEmail = mode === "signin" || mode === "signup";
  const showPassword = mode === "signin" || mode === "signup";
  const showCurrentPassword = mode === "updatePassword";
  const showNewPassword = mode === "updatePassword";
  const showConfirmPassword = mode === "signup" || mode === "updatePassword";

  // When confirming a password, which field must it match?
  const passwordFieldToMatch = mode === "signup" ? "password" : "newPassword";

  // Build the rules for the main password field. Sign up must enforce a minimum
  // length; sign in only needs some value. We build the list step by step
  // instead of using a hard-to-read one-liner.
  const passwordRules: NonNullable<FormItemProps["rules"]> = [
    { required: true, message: "Please enter your password." },
  ];
  if (mode === "signup") {
    passwordRules.push({
      min: MIN_PASSWORD_LENGTH,
      message: "Password must be at least " + MIN_PASSWORD_LENGTH + " characters.",
    });
  }

  // Choose the button text based on the mode and whether a request is running.
  let submitText = "Submit";
  if (mode === "signin") {
    submitText = loading ? "Signing in..." : "Sign in";
  } else if (mode === "signup") {
    submitText = loading ? "Creating account..." : "Create account";
  } else if (mode === "updatePassword") {
    submitText = loading ? "Updating..." : "Update password";
  }

  // Ant Design calls this with the collected values once they pass validation.
  function handleFinish(values: AuthFormValues) {
    onSubmit(values);
  }

  return (
    <div style={{ maxWidth: 420, margin: "0 auto" }}>
      <h1 style={{ textAlign: "center", marginBottom: 24 }}>{title}</h1>

      {/* Show the server/validation error, if any, above the form. */}
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
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: "Please enter a username." }]}
          >
            <Input placeholder="Your name" autoComplete="username" />
          </Form.Item>
        ) : null}

        {showEmail ? (
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Please enter your email." },
              // Use our shared isValidEmail helper so the rule matches anywhere
              // else that needs to check an email.
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
              // A custom rule: the new password must differ from the current one.
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
            // "dependencies" re-runs this field's validation when the matched
            // password field changes.
            dependencies={[passwordFieldToMatch]}
            rules={[
              { required: true, message: "Please confirm your password." },
              // A custom rule: this value must equal the password it confirms.
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

      {/* Optional links (for example switching between sign in and sign up). */}
      {footer !== undefined ? (
        <div style={{ textAlign: "center" }}>{footer}</div>
      ) : null}
    </div>
  );
}

export default AuthForm;
