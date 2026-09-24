import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const SRC_DOC =
  "<!DOCTYPE html><html><head><style>html,body{margin:0;overflow:hidden;}</style></head><body></body></html>";

function useIsolatedModuleStyles(doc: Document | null) {
  useEffect(() => {
    if (!doc) return;

    const isModuleStyleTag = (node: Node): node is HTMLStyleElement => {
      if (!(node instanceof HTMLElement) || node.tagName !== "STYLE")
        return false;
      const devId = node.getAttribute("data-vite-dev-id") || "";
      return /\.module\.(css|scss|less)(\?.*)?$/.test(devId);
    };

    const cloneMap = new WeakMap<Node, HTMLStyleElement>();

    const clone = (node: HTMLStyleElement) => {
      const c = node.cloneNode(true) as HTMLStyleElement;
      doc.head.appendChild(c);
      cloneMap.set(node, c);
    };

    // initial sync of module styles already present
    document.head
      .querySelectorAll("style[data-vite-dev-id]")
      .forEach((node) => {
        if (isModuleStyleTag(node)) clone(node);
      });

    // keep in sync: new modules mounting, HMR edits, unmounts
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((n) => {
          if (isModuleStyleTag(n)) clone(n);
        });
        m.removedNodes.forEach((n) => {
          const c = cloneMap.get(n);
          if (c) {
            c.remove();
            cloneMap.delete(n);
          }
        });
        if (m.type === "characterData") {
          let t: Node | null = m.target;
          while (t && (t as HTMLElement).tagName !== "STYLE") t = t.parentNode;
          if (t && isModuleStyleTag(t)) {
            cloneMap.get(t)!.textContent = t.textContent;
          }
        }
      }
    });

    observer.observe(document.head, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, [doc]);
}

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

  useIsolatedModuleStyles(doc);

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
