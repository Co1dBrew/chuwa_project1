// Root component: wraps the routes in the Redux and router providers.

import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider } from "antd";
import { store } from "./app/store";
import AppRoutes from "./routes/AppRoutes";

// Same font stack as body in index.css, so Ant Design components match plain text.
const FONT_FAMILY =
  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

function App() {
  return (
    <Provider store={store}>
      <ConfigProvider theme={{ token: { fontFamily: FONT_FAMILY } }}>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ConfigProvider>
    </Provider>
  );
}

export default App;
