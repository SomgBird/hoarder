import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const SRC_DOC =
  "<!DOCTYPE html><html><head><style>html,body{margin:0;overflow:hidden;}</style></head><body></body></html>";

function AutoHeightIframe({ children }: { children: React.ReactNode }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [doc, setDoc] = useState<Document | null>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const trySetDoc = () => {
      const d = iframe.contentDocument;
      if (d && d.body) setDoc(d);
    };

    if (iframe.contentDocument?.readyState === "complete") {
      trySetDoc();
    }

    iframe.addEventListener("load", trySetDoc);
    return () => iframe.removeEventListener("load", trySetDoc);
  }, []);

  useEffect(() => {
    if (!doc) return;
    const body = doc.body;

    const resize = () => setHeight(body.scrollHeight);
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(body);
    return () => ro.disconnect();
  }, [doc]);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={SRC_DOC}
      style={{ width: "100%", height, border: "none", display: "block" }}
    >
      {doc && createPortal(children, doc.body)}
    </iframe>
  );
}

function ContentFrame({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ height: "100%", overflowY: "auto" }}>
      <AutoHeightIframe>{children}</AutoHeightIframe>
    </div>
  );
}

export default ContentFrame;
