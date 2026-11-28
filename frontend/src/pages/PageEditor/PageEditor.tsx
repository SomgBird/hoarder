import { collectionPath, parseRecordId, RECORD_PAGES, type RecordPage } from "@components/Explorer/locations";
import { useEffect, useState } from "react";
import { FileFind, FileText } from "@react95/icons";
import { PageEditorWindow } from "./PageEditorWindow";
import styles from "./PageEditor.module.css";
import { Button } from "@react95/core";
import { useNavigate, useSearchParams } from "react-router-dom";
import { itemService } from "@services";
import { articleService, type ArticleRead } from "@services/articleService";
import { franchisePageService, type FranchisePageRead } from "@services/franchisePageService";
import { ITEM_TYPES, type ItemRead } from "@types";
import { PageEditorWizard } from "./PageEditorWizard/PageEditorWizard";
import { PageEditorWorkspace } from "./PageEditorWorkspace/PageEditorWorkspace";
import { ArticleEditor } from "./ArticleEditor";
import { FranchiseEditor } from "./FranchiseEditor";
import type { PageData } from "./pageTypes";

export function PageEditor() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const kind = RECORD_PAGES.find((page) => searchParams.has(`${page}Id`));
  // null = still in the wizard, otherwise the wizard's result
  const [pageData, setPageData] = useState<PageData | null>(null);

  if (kind) {
    const id = parseRecordId(searchParams.get(`${kind}Id`));
    if (id === null) {
      const back = () => navigate("/collection-view");
      return <PageEditorWindow editing onClose={back}>
        <div className={styles.message}><FileFind variant="32x32_4" aria-hidden="true" /><p role="alert">Invalid {kind} ID.</p></div>
        <div className={styles.actions}><Button onClick={back}>Back to collection</Button></div>
      </PageEditorWindow>;
    }
    return <ExistingPageEditor key={`${kind}-${id}`} kind={kind} id={id}
      onClose={() => navigate(collectionPath({ page: kind, id }))} />;
  }

  if (!pageData) {
    const initialType = RECORD_PAGES.find((page) => page === searchParams.get("new"));
    return <PageEditorWizard initialType={initialType} onFinish={setPageData} />;
  }

  if (pageData.pageType === "article") {
    return <ArticleEditor initialTitle={pageData.title.trim()} onClose={() => setPageData(null)}
      onSaved={(id) => navigate(`/collection-view?articleId=${id}`)} />;
  }

  if (pageData.pageType === "franchise" && pageData.franchise) {
    const { id } = pageData.franchise;
    return <ExistingPageEditor kind="franchise" id={id} onClose={() => setPageData(null)}
      onSaved={() => navigate(collectionPath({ page: "franchise", id }))} />;
  }

  return (
    <PageEditorWorkspace
      initialData={pageData}
      onClose={() => setPageData(null)} // back to a fresh wizard
    />
  );
}

function ExistingPageEditor({ kind, id, onClose, onSaved = onClose }: {
  kind: RecordPage; id: number; onClose: () => void; onSaved?: () => void;
}) {
  const [page, setPage] = useState<ItemRead | ArticleRead | FranchisePageRead | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const load = { article: articleService.get, item: itemService.get, franchise: franchisePageService.get }[kind];
    load(id, controller.signal).then((loaded) => {
      if (controller.signal.aborted) return;
      if ("item_type" in loaded && !ITEM_TYPES.some((type) => type === loaded.item_type.name)) {
        throw new Error(`Unsupported item type: ${loaded.item_type.name}`);
      }
      setPage(loaded);
    }).catch((e) => {
      if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Request failed.");
    });
    return () => controller.abort();
  }, [kind, id, attempt]);

  if (page && "introduction" in page) return <FranchiseEditor franchise={page} onClose={onClose} onSaved={onSaved} />;
  if (page && "blocks" in page) return <ArticleEditor initialTitle={page.title} existing={page} onClose={onClose} onSaved={onSaved} />;
  if (page) return <PageEditorWorkspace existingItem={page} onClose={onClose} onSaved={onSaved} />;

  return <PageEditorWindow editing onClose={onClose}>
    <div className={styles.message}>
      <FileText variant="32x32_4" aria-hidden="true" />
      {error ? <p role="alert">Could not load {kind}. {error}</p> : <p role="status">Loading {kind}…</p>}
    </div>
    <div className={styles.actions}>
      {error && <Button onClick={() => { setError(""); setAttempt((value) => value + 1); }}>Retry</Button>}
      <Button onClick={onClose}>Cancel</Button>
    </div>
  </PageEditorWindow>;
}
