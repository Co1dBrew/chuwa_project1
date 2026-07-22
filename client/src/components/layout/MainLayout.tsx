// Shared page frame: Header on top, Footer on the bottom, matched page via <Outlet />.

import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

function MainLayout() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />

      {/* flex: 1 makes the main area grow, pushing the footer down. */}
      <main style={{ flex: 1 }}>
        <div className="page-container">
          <Outlet />
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default MainLayout;
