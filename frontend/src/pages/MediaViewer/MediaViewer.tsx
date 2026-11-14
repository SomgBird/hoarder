import { useEffect, useState } from "react";
import { Button, Frame, TitleBar } from "@react95/core";
import { Wangimg128 } from "@react95/icons";
import { ImageViewer } from "@components/ImageViewer/ImageViewer";
import { coverUrl, mediaService } from "@services";
import type { MediaFileRead } from "@types";
import { MediaThumbnail } from "./MediaThumbnail";
import styles from "./MediaViewer.module.css";

type Result = { key: number; files?: MediaFileRead[]; error?: string };

export function MediaViewer() {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [openFile, setOpenFile] = useState<MediaFileRead | null>(null);
  const current = result?.key === revision ? result : null;
  const loading = current === null;

  useEffect(() => {
    const controller = new AbortController();
    mediaService.list(controller.signal).then((files) => {
      if (!controller.signal.aborted) setResult({ key: revision, files });
    }).catch((error) => {
      if (!controller.signal.aborted) setResult({ key: revision, error: error instanceof Error ? error.message : "Failed to load media." });
    });
    return () => controller.abort();
  }, [revision]);

  return (
    <>
      <Frame className={styles.window} bgColor="$material" boxShadow="$out" padding="$3" inert={openFile !== null}>
        <TitleBar title="Media Viewer" icon={<Wangimg128 variant="16x16_4" />} />
        <div className={styles.toolbar}>
          <Button disabled={loading} onClick={() => setRevision((value) => value + 1)}>Refresh</Button>
          <span>Double-click an image to open it, or press Enter.</span>
        </div>
        <Frame className={styles.content} bgColor="$inputBackground" boxShadow="$in" padding="$2" aria-busy={loading}>
          {loading && <p role="status">Loading media…</p>}
          {current?.error && <div role="alert">
            <p>{current.error}</p>
            <Button onClick={() => setRevision((value) => value + 1)}>Retry</Button>
          </div>}
          {current?.files?.length === 0 && <p>No media yet.</p>}
          {current?.files && current.files.length > 0 && <ul className={styles.files} aria-label="Media files">
            {current.files.map((file) => <li key={file.path}>
              <MediaThumbnail file={file} selected={file.path === selectedPath} onSelect={() => setSelectedPath(file.path)}
                onOpen={() => { setSelectedPath(file.path); setOpenFile(file); }} />
            </li>)}
          </ul>}
        </Frame>
        <div className={styles.status} role="status">
          {current?.files ? `${current.files.length} ${current.files.length === 1 ? "file" : "files"}` : ""}
        </div>
      </Frame>
      {openFile && <ImageViewer key={openFile.path} src={coverUrl(openFile.path)!} name={openFile.relative_path} onClose={() => setOpenFile(null)} />}
    </>
  );
}
