import type { ReactNode } from "react";
import { useExplorer } from "../ExplorerContext";
import styles from "./ExplorerMessage.module.css";

interface Props {
  heading: string;
  message: ReactNode;
  hint?: string;
}

export function ErrorPage({ heading, message, hint }: Props) {
  const { navigate } = useExplorer();
  return (
    <section className={styles.error}>
      <h1>{heading}</h1>
      <hr />
      <p>{message}</p>
      {hint && <p>{hint}</p>}
      <p>
        <a href="/collection-view" onClick={(event) => {
          if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          navigate({ page: "home" });
        }}>Go to the home page</a>
      </p>
    </section>
  );
}
