import { useMemo } from "react";
import { AlertCircle, AlertTriangle, Plus, Trash2 } from "lucide-react";
import { useI18n } from "../i18n/context";
import { isScalar } from "../lib/fields";
import { KEY, keyOf, money } from "../lib/reconcile";
import { Button, Field, Section } from "./ui";

const TH = "text-[10.5px] font-medium text-muted uppercase tracking-wide px-1.5 py-2 border-b border-line whitespace-nowrap bg-soft";
const TD = "border-b border-soft align-middle";

const ROW_BG = { error: "bg-danger-bg", warning: "bg-warn-bg" };

const LevelIcon = ({ level }) =>
  level === "error" ? <AlertCircle size={13} className="text-danger inline" />
    : level === "warning" ? <AlertTriangle size={13} className="text-warn inline" />
    : null;

/* Editable invoice lines: a table on wider screens, stacked cards on phones. Columns are the union of keys across all lines; a
 * computed "qty × price" column is added when both fields are present. */
export default function LineItemsTable({ lines, lineLevel, lineNet, onChange, onAdd, onRemove }) {
  const { t, fieldLabel } = useI18n();

  const lineKeys = useMemo(() => {
    const seen = new Set();
    lines.forEach((l) => Object.keys(l || {}).forEach((k) => seen.add(k)));
    return [...seen];
  }, [lines]);

  const showComputed = Boolean(lines[0] && keyOf(lines[0], KEY.qty) && keyOf(lines[0], KEY.price));

  return (
    <Section
      title={t("review.lines", { count: lines.length })}
      action={lines.length > 0 && <Button onClick={onAdd}><Plus size={13} /> {t("review.addLine")}</Button>}
    >
      {lines.length === 0 ? (
        <div className="text-[13px] text-muted px-3.5 py-3 border border-line rounded-lg bg-panel">
          {t("review.noLines")}
        </div>
      ) : (
        <>
        <div className="hidden sm:block border border-line rounded-lg overflow-auto bg-panel">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="w-[26px] bg-soft border-b border-line" />
                {lineKeys.map((k) => (
                  <th key={k} className={`${TH} ${k === "description" ? "text-left" : "text-right"}`}>
                    {fieldLabel(k)}
                  </th>
                ))}
                {showComputed && <th className={`${TH} w-[76px] text-right`}>{t("review.lineComputed")}</th>}
                <th className="w-[30px] bg-soft border-b border-line" />
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => (
                <LineRow
                  key={i}
                  index={i}
                  line={line}
                  keys={lineKeys}
                  level={lineLevel[i]}
                  computed={showComputed ? lineNet?.[i] : undefined}
                  showComputed={showComputed}
                  onChange={(k, v) => onChange(i, k, v)}
                  onRemove={() => onRemove(i)}
                  deleteLabel={t("review.deleteLine")}
                />
              ))}
            </tbody>
          </table>
        </div>
        <ul className="sm:hidden flex flex-col gap-2.5">
          {lines.map((line, i) => (
            <LineCard
              key={i}
              index={i}
              line={line}
              keys={lineKeys}
              level={lineLevel[i]}
              computed={showComputed ? lineNet?.[i] : undefined}
              showComputed={showComputed}
              onChange={(k, v) => onChange(i, k, v)}
              onRemove={() => onRemove(i)}
            />
          ))}
        </ul>
        </>
      )}
    </Section>
  );
}

function LineRow({ index, line, keys, level, computed, showComputed, onChange, onRemove, deleteLabel }) {
  const rowBg = ROW_BG[level] ?? (index % 2 ? "bg-panel" : "bg-transparent");
  return (
    <tr className={rowBg}>
      <td className={`${TD} px-0.5 py-0.5 text-center`}>
        {level ? <LevelIcon level={level} /> : <span className="text-muted text-[11px]">{index + 1}</span>}
      </td>
      {keys.map((k) => {
        const v = line[k];
        const isDescription = k === "description";
        return (
          <td key={k} className={`${TD} px-1 py-0.5`}>
            {v === undefined || isScalar(v) ? (
              <input
                value={v ?? ""}
                onChange={(e) => onChange(k, e.target.value)}
                className={`w-full min-w-[60px] text-[12.5px] text-ink bg-transparent border border-transparent rounded px-1.5 py-1.5 outline-none focus:ring-2 focus:ring-focus focus:bg-white ${
                  isDescription ? "font-sans text-left" : "font-mono text-right"
                }`}
              />
            ) : (
              <span className="text-[11.5px] text-muted">{JSON.stringify(v)}</span>
            )}
          </td>
        );
      })}
      {showComputed && (
        <td className={`${TD} px-1 py-0.5 text-right text-[12.5px] font-mono ${Number.isFinite(computed) ? "text-ink" : "text-muted"}`}>
          {Number.isFinite(computed) ? money(computed) : "—"}
        </td>
      )}
      <td className={`${TD} px-0.5 py-0.5 text-center`}>
        <button
          type="button"
          onClick={onRemove}
          aria-label={deleteLabel}
          title={deleteLabel}
          className="inline-flex items-center justify-center text-muted rounded p-1.5 cursor-pointer hover:text-danger transition-colors"
        >
          <Trash2 size={13} />
        </button>
      </td>
    </tr>
  );
}

/* Phone layout: one card per line, description full width, other fields in a grid. */
function LineCard({ index, line, keys, level, computed, showComputed, onChange, onRemove }) {
  const { t, fieldLabel } = useI18n();
  const border = level === "error" ? "border-danger-border bg-danger-bg" : level === "warning" ? "border-warn/30 bg-warn-bg" : "border-line bg-panel";
  return (
    <li className={`border rounded-lg p-3 ${border}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-1.5 text-[12px] font-medium text-muted">
          <LevelIcon level={level} /> {t("review.lineNumber", { line: index + 1 })}
        </span>
        <div className="flex items-center gap-1">
          {showComputed && (
            <span className={`text-[12.5px] font-mono ${Number.isFinite(computed) ? "text-ink" : "text-muted"}`}>
              = {Number.isFinite(computed) ? money(computed) : "—"}
            </span>
          )}
          <button
            type="button"
            onClick={onRemove}
            aria-label={t("review.deleteLine")}
            className="inline-flex items-center justify-center text-muted rounded p-2 cursor-pointer hover:text-danger transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {keys.map((k) => {
          const v = line[k];
          if (v !== undefined && !isScalar(v)) return null;
          return (
            <div key={k} className={k === "description" ? "col-span-2" : undefined}>
              <Field label={fieldLabel(k)} value={v} mono={k !== "description"} onChange={(val) => onChange(k, val)} />
            </div>
          );
        })}
      </div>
    </li>
  );
}
