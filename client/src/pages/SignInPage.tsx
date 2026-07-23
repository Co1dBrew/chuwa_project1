// Renders AuthForm in "signin" mode and wires it to the Redux auth thunk.

import { useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { message } from "antd";
import AuthForm from "../components/auth/AuthForm";
import type { AuthFormValues } from "../components/auth/AuthForm";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { clearAuthError, signInThunk } from "../features/auth/authSlice";
import {
  selectAuthError,
  selectAuthLoading,
  selectIsAuthenticated,
} from "../features/auth/authSelectors";

function SignInPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const loading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  // Clear any leftover error from a previous visit.
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
      password: values.password ?? "",
    };

    // .unwrap() resolves on success and throws on failure.
    // (The cart is loaded by App once the user is signed in.)
    dispatch(signInThunk(input))
      .unwrap()
      .then(function () {
        message.success("Signed in.");
        navigate("/products");
      })
      .catch(function () {
        // The error is stored in Redux and shown by AuthForm.
      });
  }

  return (
    <AuthForm
      mode="signin"
      title="Sign in"
      loading={loading}
      error={error}
      onSubmit={handleSubmit}
      footer={
        <span>
          Don&apos;t have an account? <Link to="/signup">Sign up</Link>
        </span>
      }
    />
  );
}

export default SignInPage;
