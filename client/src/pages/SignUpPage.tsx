/*
 * SignUpPage renders the reusable AuthForm in "signup" mode and connects it to
 * the Redux sign-up thunk. New accounts are created with the "user" role.
 */

import { useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { message } from "antd";
import AuthForm from "../components/auth/AuthForm";
import type { AuthFormValues } from "../components/auth/AuthForm";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { clearAuthError, signUpThunk } from "../features/auth/authSlice";
import {
  selectAuthError,
  selectAuthStatus,
  selectIsAuthenticated,
} from "../features/auth/authSelectors";

function SignUpPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const status = useAppSelector(selectAuthStatus);
  const error = useAppSelector(selectAuthError);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  useEffect(
    function () {
      dispatch(clearAuthError());
    },
    [dispatch],
  );

  if (isAuthenticated) {
    return <Navigate to="/products" replace />;
  }

  function handleSubmit(values: AuthFormValues) {
    const input = {
      username: values.username ?? "",
      email: values.email ?? "",
      password: values.password ?? "",
    };

    dispatch(signUpThunk(input))
      .unwrap()
      .then(function () {
        message.success("Account created. Welcome!");
        navigate("/products");
      })
      .catch(function () {
        // The error (for example a duplicate email) is shown by AuthForm.
      });
  }

  return (
    <AuthForm
      mode="signup"
      title="Create your account"
      loading={status === "loading"}
      error={error}
      onSubmit={handleSubmit}
      footer={
        <span>
          Already have an account? <Link to="/signin">Sign in</Link>
        </span>
      }
    />
  );
}

export default SignUpPage;
