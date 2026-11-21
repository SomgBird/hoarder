import { useEffect, useState } from "react";
import { Button, Frame, TitleBar } from "@react95/core";
import { Files } from "@react95/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import CollectionManager from "@components/CollectionManager/CollectionManager";
import { HelpButton } from "@components/HelpButton/HelpButton";
import { itemService } from "@services";
import type { ItemRead } from "@types";
import { CopyWorkspace } from "./CopyWorkspace";
import styles from "./CopyEditor.module.css";

export function CopyEditor() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<number | null>(null);
  const param = params.get("itemId");
  const id = Number(param);
  const chooseItem = () => setParams({});

  if (param === null) return <div className={styles.window}>
    <CollectionManager selectedItemId={selected} onSelectItem={setSelected}
      onOpenItem={(itemId) => setParams({ itemId: String(itemId) })}
      picker={{ title: "Copy Editor — Choose an item", icon: <Files variant="16x16_4" />,
        helpTopic: "copies", actionLabel: "Open copies" }} />
  </div>;

  return <Frame className={styles.window} bgColor="$material" boxShadow="$out" padding="$3">
    <TitleBar title="Copy Editor" icon={<Files variant="16x16_4" />}>
      <TitleBar.OptionsBox><HelpButton topic="copies" /></TitleBar.OptionsBox>
    </TitleBar>
    {Number.isSafeInteger(id) && id > 0
      ? <ItemCopies key={id} id={id} onChooseItem={chooseItem}
          onViewItem={() => navigate(`/collection-view?itemId=${id}`)} />
      : <><p role="alert">Invalid item ID.</p><Button onClick={chooseItem}>Choose another item</Button></>}
  </Frame>;
}

function ItemCopies({ id, onChooseItem, onViewItem }: {
  id: number; onChooseItem: () => void; onViewItem: () => void;
}) {
  const [item, setItem] = useState<ItemRead | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    itemService.get(id, controller.signal).then((loaded) => {
      if (!controller.signal.aborted) setItem(loaded);
    }).catch((cause) => {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not load item.");
    });
    return () => controller.abort();
  }, [id, attempt]);

  if (item) return <CopyWorkspace item={item} onChanged={setItem} onChooseItem={onChooseItem} onViewItem={onViewItem} />;
  return <>
    {error ? <div role="alert"><p>{error}</p>
      <Button onClick={() => { setError(""); setAttempt((value) => value + 1); }}>Retry</Button>
    </div> : <p role="status">Loading item…</p>}
    <Button onClick={onChooseItem}>Choose another item</Button>
  </>;
}
