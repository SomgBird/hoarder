import type { ExplorerLocation } from "../locations";
import { HomePage } from "./HomePage";
import { ErrorPage } from "./ErrorPage";
import { ItemPage } from "./ItemPage";

export function renderPage(loc: ExplorerLocation) {
  switch (loc.page) {
    case "home":
      return <HomePage />;
    case "item":
      return <ItemPage id={loc.id} />;
    case "error":
      return (
        <ErrorPage
          heading="Cannot find page"
          message={`The address ${loc.url} is not valid.`}
          hint="Check the address for typos."
        />
      );
  }
}



