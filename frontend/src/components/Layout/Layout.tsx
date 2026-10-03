import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { NavBar } from "@components";
import styles from "./Layout.module.css";

function Layout() {
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
