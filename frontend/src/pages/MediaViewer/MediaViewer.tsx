import { useState } from "react";
import { Button, Frame, TitleBar } from "@react95/core";
import { Wangimg128 } from "@react95/icons";
import { ImageViewer } from "@components/ImageViewer/ImageViewer";
import { HelpButton } from "@components/HelpButton/HelpButton";
import { useMediaFiles } from "../../hooks/useMediaFiles";
import { describeMediaFile } from "@services/mediaService";
import { coverUrl } from "@services/utils";
import type { MediaFileRead } from "@types";
import { MediaThumbnail } from "./MediaThumbnail";
import styles from "./MediaViewer.module.css";

export function MediaViewer() {
  const { result: current, refresh } = useMediaFiles();
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [openFile, setOpenFile] = useState<MediaFileRead | null>(null);
  const loading = !current;
  const openDescription = openFile && describeMediaFile(openFile, openFile.relative_path);

  return (
    <>
      <Frame className={styles.window} bgColor="$material" boxShadow="$out" padding="$3" inert={openFile !== null}>
        <TitleBar title="Media Viewer" icon={<Wangimg128 variant="16x16_4" />}>
          <TitleBar.OptionsBox><HelpButton topic="media" /></TitleBar.OptionsBox>
        </TitleBar>
        <div className={styles.toolbar}>
          <Button disabled={loading} onClick={refresh}>Refresh</Button>
          <span>Double-click an image to open it, or press Enter.</span>
        </div>
        <Frame className={styles.content} bgColor="$inputBackground" boxShadow="$in" padding="$2" aria-busy={loading}>
          {loading && <p role="status">Loading media…</p>}
          {current?.error && <div role="alert">
            <p>{current.error}</p>
            <Button onClick={refresh}>Retry</Button>
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
      {openFile && openDescription && <ImageViewer key={openFile.path} src={coverUrl(openFile.path)!}
        name={openDescription.name}
        caption={openDescription.copies.join("\n")}
        onClose={() => setOpenFile(null)} />}
    </>
  );
}
