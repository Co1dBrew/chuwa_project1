/*
 * UpdatePasswordPage renders the reusable AuthForm in "updatePassword" mode and
 * connects it to the Redux update-password thunk.
 *
 * This page is wrapped in ProtectedRoute, so it is only reachable while signed
 * in. The thunk figures out who the current user is from the store.
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import AuthForm from "../components/auth/AuthForm";
import type { AuthFormValues } from "../components/auth/AuthForm";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { clearAuthError, updatePasswordThunk } from "../features/auth/authSlice";
import {
  selectAuthError,
  selectAuthStatus,
} from "../features/auth/authSelectors";

function UpdatePasswordPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const status = useAppSelector(selectAuthStatus);
  const error = useAppSelector(selectAuthError);

  useEffect(
    function () {
      dispatch(clearAuthError());
    },
    [dispatch],
  );

  function handleSubmit(values: AuthFormValues) {
    const input = {
      currentPassword: values.currentPassword ?? "",
      newPassword: values.newPassword ?? "",
    };

    dispatch(updatePasswordThunk(input))
      .unwrap()
      .then(function () {
        message.success("Your password has been updated.");
        navigate("/products");
      })
      .catch(function () {
        // The error (for example a wrong current password) is shown by AuthForm.
      });
  }

  return (
    <AuthForm
      mode="updatePassword"
      title="Update password"
      loading={status === "loading"}
      error={error}
      onSubmit={handleSubmit}
    />
  );
}

export default UpdatePasswordPage;
