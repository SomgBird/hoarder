import { Suspense } from "react";
import { Outlet, useLocation, useSearchParams } from "react-router-dom";
import { NavBar } from "@components";
import styles from "./Layout.module.css";

function Layout() {
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  if (pathname === "/help" && params.get("window") === "1") {
    return <main className={styles.helpWindow}><Suspense fallback="Loading…"><Outlet /></Suspense></main>;
  }
  return (
    <div className={styles.page}>
      <NavBar className={styles.navbar} />
      <main className={styles.content}>
        <Suspense fallback="Loading…">
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}

export default Layout;
