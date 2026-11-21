import { useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { getHelpGroup, HELP_ROOT, HELP_TOPICS, isHelpFolder, isHelpPage, isHelpTopic, type HelpPage } from "@config/help";

interface HelpHistory {
  pages: HelpPage[];
  index: number;
}

const samePage = (left: HelpPage, right: HelpPage) => left.kind === right.kind && left.id === right.id;

function readHistory(value: unknown, page: HelpPage): HelpHistory {
  const initial = { pages: [page], index: 0 };
  if (!value || typeof value !== "object") return initial;
  const { pages, index } = value as Partial<HelpHistory>;
  if (!Array.isArray(pages) || !Number.isInteger(index) || index === undefined
    || index < 0 || index >= pages.length) return initial;
  // Iteration also checks sparse slots, which Array.every would skip.
  for (const entry of pages) if (!isHelpPage(entry)) return initial;
  if (!samePage(pages[index], page)) return initial;
  return { pages, index };
}

export function useHelpNavigation() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const page = useMemo<HelpPage>(() => {
    const requested = params.get("topic");
    if (requested !== null) return { kind: "topic", id: isHelpTopic(requested) ? requested : "welcome" };
    const folder = params.get("folder");
    return isHelpFolder(folder) ? { kind: "folder", id: folder } : HELP_ROOT;
  }, [params]);
  const history = useMemo(() => readHistory(location.state?.helpHistory, page), [location.state, page]);
  const group = getHelpGroup(page);
  const title = page.kind === "topic" ? HELP_TOPICS[page.id] : group?.label ?? "Hoarder Help";
  const path: { page: HelpPage; label: string }[] = [{ page: HELP_ROOT, label: "Hoarder Help" }];
  if (group) path.push({ page: { kind: "folder", id: group.id }, label: group.label });
  if (page.kind === "topic") path.push({ page, label: title });
  const parent = path.at(-2)?.page ?? null;
  const standalone = params.get("window") === "1";

  const select = (next: HelpPage, helpHistory: HelpHistory) => {
    // Keep the URL and history in the same router update, including in transitions.
    const nextParams = new URLSearchParams(params);
    nextParams.delete("topic");
    nextParams.delete("folder");
    nextParams.set(next.kind, next.id);
    setParams(nextParams, { replace: true, state: { ...location.state, helpHistory } });
  };
  const showPage = (next: HelpPage) => {
    if (samePage(next, page)) return;
    select(next, { pages: [...history.pages.slice(0, history.index + 1), next], index: history.index + 1 });
  };
  const go = (offset: number) => {
    const index = history.index + offset;
    if (index < 0 || index >= history.pages.length) return;
    select(history.pages[index], { ...history, index });
  };
  const close = () => {
    if (standalone && window.opener) window.close();
    else navigate("/");
  };

  return { page, group, title, path, parent, standalone, showPage, go, close,
    canGoBack: history.index > 0, canGoForward: history.index < history.pages.length - 1 };
}
