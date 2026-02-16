import { Outlet } from "react-router-dom";
import Header from "./components/custom/Header";
import Footer from "./components/custom/Footer";
import { Toaster } from "./components/ui/sonner";
import { useSEO } from "./context/SEOContext";

function App() {
  const { pageSEO } = useSEO();

  return (
    <>
      {/* Global SEO */}
      {pageSEO.home()}

      {/* Layout */}
      <Header />

      {/* Page content */}
      <main>
        <Outlet />
      </main>

      <Footer />
      <Toaster />
    </>
  );
}

export default App;
