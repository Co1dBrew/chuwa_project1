/*
 * SignInPage renders the reusable AuthForm in "signin" mode and connects it to
 * the Redux auth thunk. The form handles the layout and validation; this page
 * handles what to do with the values (dispatch the thunk) and where to go on
 * success.
 */

import { useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { message } from "antd";
import AuthForm from "../components/auth/AuthForm";
import type { AuthFormValues } from "../components/auth/AuthForm";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { clearAuthError, signInThunk } from "../features/auth/authSlice";
import {
  selectAuthError,
  selectAuthStatus,
  selectIsAuthenticated,
} from "../features/auth/authSelectors";

function SignInPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const status = useAppSelector(selectAuthStatus);
  const error = useAppSelector(selectAuthError);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  // Clear any leftover error from a previous visit when this page opens.
  useEffect(
    function () {
      dispatch(clearAuthError());
    },
    [dispatch],
  );

  // If the user is already signed in, there is no reason to be here.
  if (isAuthenticated) {
    return <Navigate to="/products" replace />;
  }

  function handleSubmit(values: AuthFormValues) {
    const input = {
      email: values.email ?? "",
      password: values.password ?? "",
    };

    // dispatch returns a promise. .unwrap() makes it resolve on success and
    // throw on failure, so we can react with .then / .catch.
    dispatch(signInThunk(input))
      .unwrap()
      .then(function () {
        message.success("Signed in.");
        navigate("/products");
      })
      .catch(function () {
        // The error message is already stored in Redux and shown by AuthForm,
        // so there is nothing extra to do here.
      });
  }

  return (
    <AuthForm
      mode="signin"
      title="Sign in"
      loading={status === "loading"}
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
