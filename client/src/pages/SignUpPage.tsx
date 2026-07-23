// Renders AuthForm in "signup" mode and wires it to the Redux sign-up thunk.

import { useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { message } from "antd";
import AuthForm from "../components/auth/AuthForm";
import type { AuthFormValues } from "../components/auth/AuthForm";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { clearAuthError, signUpThunk } from "../features/auth/authSlice";
import {
  selectAuthError,
  selectAuthLoading,
  selectIsAuthenticated,
} from "../features/auth/authSelectors";

function SignUpPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const loading = useAppSelector(selectAuthLoading);
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
      role: values.role ?? "customer",
    };

    // (The cart is loaded by App once the user is signed in.)
    dispatch(signUpThunk(input))
      .unwrap()
      .then(function () {
        message.success("Account created. Welcome!");
        navigate("/products");
      })
      .catch(function () {
        // The error is shown by AuthForm.
      });
  }

  return (
    <AuthForm
      mode="signup"
      title="Create your account"
      loading={loading}
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
