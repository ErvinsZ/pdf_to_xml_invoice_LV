import { useMemo, useState } from "react";

/* Holds the extraction being reviewed and the immutable update helpers the
 * review screen edits it with. */
export default function useInvoiceEditor() {
  const [ext, setExt] = useState(null);

  const editor = useMemo(() => ({
    setTop: (key, value) => setExt((p) => ({ ...p, [key]: value })),
    setNested: (parent, key, value) =>
      setExt((p) => ({ ...p, [parent]: { ...(p[parent] || {}), [key]: value } })),
    setLine: (i, key, value) =>
      setExt((p) => {
        const lines = p.lines.slice();
        lines[i] = { ...lines[i], [key]: value };
        return { ...p, lines };
      }),
    removeLine: (i) => setExt((p) => ({ ...p, lines: p.lines.filter((_, j) => j !== i) })),
    // new lines copy the first line's keys so every column stays editable
    addLine: () =>
      setExt((p) => {
        const template = p.lines?.[0]
          ? Object.fromEntries(Object.keys(p.lines[0]).map((k) => [k, ""]))
          : { description: "" };
        return { ...p, lines: [...(p.lines || []), template] };
      }),
  }), []);

  return { ext, setExt, editor };
}
