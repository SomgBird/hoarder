import { Outlet } from "react-router-dom";
import NavBar from "./NavBar";
import styles from "./Layout.module.css"

function Layout() {
    return (
    <div className={styles.page}>
        <NavBar className={styles.navbar}/>
        <main className={styles.content}>
            <Outlet />
        </main>
    </div>
    );
}

export default Layout;