import type { ReactNode } from "react";
import { ExplorerLink } from "../ExplorerLink";
import styles from "./ExplorerMessage.module.css";

interface Props {
  heading: string;
  message: ReactNode;
  hint?: string;
}

export function ErrorPage({ heading, message, hint }: Props) {
  return (
    <section className={styles.error}>
      <h1>{heading}</h1>
      <hr />
      <p>{message}</p>
      {hint && <p>{hint}</p>}
      <p>
        <ExplorerLink to={{ page: "home" }}>Go to the home page</ExplorerLink>
      </p>
    </section>
  );
}
