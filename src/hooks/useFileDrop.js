import { useEffect, useRef, useState } from "react";

const hasFiles = (e) => Array.from(e.dataTransfer?.types ?? []).includes("Files");

/* Window-wide file drop. Listening on the window (rather than a drop zone)
 * means drops also work over the PDF preview iframe, and stops the browser
 * from navigating away to a dropped file. Returns whether a file is being
 * dragged over the page. */
export default function useFileDrop(onDrop) {
  const [dragging, setDragging] = useState(false);
  const depth = useRef(0);
  const onDropRef = useRef(onDrop);

  useEffect(() => { onDropRef.current = onDrop; });

  useEffect(() => {
    const enter = (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth.current += 1;
      setDragging(true);
    };
    const over = (e) => { if (hasFiles(e)) e.preventDefault(); };
    const leave = (e) => {
      if (!hasFiles(e)) return;
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setDragging(false);
    };
    const drop = (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth.current = 0;
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) onDropRef.current(file);
    };
    window.addEventListener("dragenter", enter);
    window.addEventListener("dragover", over);
    window.addEventListener("dragleave", leave);
    window.addEventListener("drop", drop);
    return () => {
      window.removeEventListener("dragenter", enter);
      window.removeEventListener("dragover", over);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("drop", drop);
    };
  }, []);

  return dragging;
}
