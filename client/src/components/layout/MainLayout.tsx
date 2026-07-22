/*
 * The shared page frame: Header on top, Footer on the bottom, and the current
 * page in the middle.
 *
 * We use it as a "layout route" in the router. React Router renders whichever
 * page matches the URL into the <Outlet /> below. This way every page gets the
 * same header and footer without repeating them.
 */

import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

function MainLayout() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />

      {/* "flex: 1" makes the main area grow to fill space, pushing the footer down. */}
      <main style={{ flex: 1 }}>
        <div className="page-container">
          {/* Outlet is the placeholder where the matched page appears. */}
          <Outlet />
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default MainLayout;
