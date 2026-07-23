// Root component: wraps the routes in the Redux and router providers.

import { useEffect } from "react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider } from "antd";
import { store } from "./app/store";
import { useAppDispatch, useAppSelector } from "./app/hooks";
import { selectCurrentUser } from "./features/auth/authSelectors";
import { loadCartThunk } from "./features/cart/cartSlice";
import AppRoutes from "./routes/AppRoutes";

// Same font stack as body in index.css, so Ant Design components match plain text.
const FONT_FAMILY =
  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

// Lives inside the Redux Provider so it can read auth state and load the cart.
function AppContent() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);

  // Whenever a regular user is signed in — including when a session was restored
  // from localStorage after reopening the page — load their cart from the
  // backend. (The cart lives on the server, so it is not kept in localStorage.)
  useEffect(
    function () {
      if (user !== null && user.role === "user") {
        dispatch(loadCartThunk());
      }
    },
    [dispatch, user],
  );

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
