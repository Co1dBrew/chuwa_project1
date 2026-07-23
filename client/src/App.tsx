import { useEffect, useRef } from "react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider } from "antd";
import { store } from "./app/store";
import { useAppDispatch, useAppSelector } from "./app/hooks";
import {
  selectAuthInitialized,
  selectCurrentUser,
} from "./features/auth/authSelectors";
import {
  initializeAuthThunk,
  logout,
} from "./features/auth/authSlice";
import { loadCartThunk } from "./features/cart/cartSlice";
import AppRoutes from "./routes/AppRoutes";
import LoadingSpinner from "./components/common/LoadingSpinner";
import { configureHttpClientAuth } from "./services/httpClient";

const FONT_FAMILY =
  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

configureHttpClientAuth({
  getAccessToken: function () {
    return store.getState().auth.token;
  },
  refreshAccessToken: async function () {
    await store.dispatch(initializeAuthThunk());
    return store.getState().auth.token !== null;
  },
  clearSession: function () {
    store.dispatch(logout());
  },
});

function AppContent() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const initialized = useAppSelector(selectAuthInitialized);
  const hasInitialized = useRef(false);

  useEffect(
    function () {
      if (!hasInitialized.current) {
        hasInitialized.current = true;
        try {
          window.localStorage.removeItem("pms.auth");
        } catch {}
        dispatch(initializeAuthThunk());
      }
    },
    [dispatch],
  );

  useEffect(
    function () {
      if (initialized && user !== null && user.role === "customer") {
        dispatch(loadCartThunk());
      }
    },
    [dispatch, initialized, user],
  );

  if (!initialized) {
    return <LoadingSpinner message="Restoring your session..." />;
  }

  return <AppRoutes />;
}

function App() {
  return (
    <Provider store={store}>
      <ConfigProvider theme={{ token: { fontFamily: FONT_FAMILY } }}>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </ConfigProvider>
    </Provider>
  );
}

export default App;
