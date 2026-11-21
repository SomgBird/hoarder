import { Link } from "react-router-dom";
import { helpUrl } from "@config/help";
import styles from "./ExplorerMessage.module.css";

export function HomePage() {
  return (
    <section className={styles.home}>
      <h1>Welcome to your collection</h1>
      <hr />
      <p>Double-click an item in Collection Manager or select it and press Enter to read its page here.</p>
      <ul>
        <li><Link to="/page-editor">Create an item page…</Link></li>
        <li><a href={helpUrl("collection", true)} target="hoarder-help">Collection Manager Help</a></li>
      </ul>
    </section>
  );
}
