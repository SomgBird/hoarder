import type { ExplorerLocation } from "../locations";
import { HomePage } from "./HomePage";
import { ErrorPage } from "./ErrorPage";
import { ItemPage } from "./ItemPage";
import { ArticlePage } from "./ArticlePage";

export function renderPage(loc: ExplorerLocation) {
  switch (loc.page) {
    case "home":
      return <HomePage />;
    case "item":
      return <ItemPage key={loc.id} id={loc.id} />;
    case "article":
      return <ArticlePage key={loc.id} id={loc.id} />;
    case "error":
      return (
        <ErrorPage
          heading="Cannot find page"
          message={<>The address <code>{loc.url}</code> is not valid.</>}
          hint="Check the address for typos."
        />
      );
  }
}



