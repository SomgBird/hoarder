import { useEffect, useState } from "react";
import { mediaService } from "@services/mediaService";
import type { MediaFileRead } from "@types";

type Result = { files: MediaFileRead[]; error?: never } | { error: string; files?: never };

export function useMediaFiles() {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<Result>();

  useEffect(() => {
    const controller = new AbortController();
    mediaService.list(controller.signal).then((files) => {
      if (!controller.signal.aborted) setResult({ files });
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) {
        setResult({ error: error instanceof Error && error.message ? error.message : "Could not load collection images." });
      }
    });
    return () => controller.abort();
  }, [revision]);

  function refresh() {
    setResult(undefined);
    setRevision((value) => value + 1);
  }

  return { result, refresh };
}
