"use client";

import { useEffect, useState } from "react";
import {
  fetchPrompts,
  previewPromptTranslate,
  savePrompts,
  type FreeTextTranslateResponse,
} from "@/lib/client-storage";
import { LANGS, PROMPTS } from "@/lib/data";
import type { DocRecord, LangCode, PromptEntry, PromptsMap } from "@/lib/types";
import { IcCheck, IcPlay, IcPlus, IcX } from "../icons";
import { LangChip } from "../primitives";

type TargetLang = Exclude<LangCode, "en">;
type SaveState = "idle" | "saving" | "saved" | "error";

interface Props {
  docs: DocRecord[];
}

export const PromptsScreen = ({ docs }: Props) => {
  const [active, setActive] = useState<TargetLang>("de");
  const [prompt, setPrompt] = useState<PromptsMap>(() => ({ ...PROMPTS }));
  const [saved, setSaved] = useState<PromptsMap>(() => ({ ...PROMPTS }));
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const [previewText, setPreviewText] = useState("");
  const [previewResult, setPreviewResult] =
    useState<FreeTextTranslateResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const p = prompt[active]!;
  const lang = LANGS.find((l) => l.code === active)!;

  // Hydrate from data/prompts.json on mount.
  useEffect(() => {
    let cancelled = false;
    fetchPrompts()
      .then((p) => {
        if (cancelled) return;
        setPrompt(p);
        setSaved(p);
      })
      .catch(() => {
        /* keep defaults on failure */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = <K extends keyof PromptEntry>(k: K, v: PromptEntry[K]) =>
    setPrompt((s) => ({
      ...s,
      [active]: { ...(s[active] as PromptEntry), [k]: v },
    }));

  // specialRules is stored on disk as string[] (one rule per item, preserving
  // blank-string separators). The editor uses a single textarea where each
  // line = one rule; we join/split on '\n' to round-trip.
  const rulesText = p.specialRules.join("\n");
  const setRulesText = (text: string) =>
    update("specialRules", text.split("\n"));

  const dirty = JSON.stringify(prompt) !== JSON.stringify(saved);

  const onSave = async () => {
    setSaveState("saving");
    setSaveError(null);
    try {
      await savePrompts(prompt);
      setSaved(prompt);
      setSaveState("saved");
      setTimeout(() => setSaveState((s) => (s === "saved" ? "idle" : s)), 2000);
    } catch (e) {
      setSaveState("error");
      setSaveError(e instanceof Error ? e.message : "Save failed");
    }
  };

  const onDiscard = () => setPrompt(saved);

  // Reset preview output when the active language changes — the result
  // belongs to whichever target was selected at run time.
  useEffect(() => {
    setPreviewResult(null);
    setPreviewError(null);
  }, [active]);

  const onRunPreview = async () => {
    const trimmed = previewText.trim();
    if (!trimmed) return;
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewResult(null);
    try {
      const result = await previewPromptTranslate(
        trimmed,
        active,
        p.specialRules,
      );
      setPreviewResult(result);
    } catch (e) {
      setPreviewError(e instanceof Error ? e.message : "Preview failed");
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="prompts-split">
      <aside className="prompts-list">
        <div className="hd">Languages</div>
        {LANGS.filter(
          (l): l is (typeof LANGS)[number] & { code: TargetLang } => !l.source,
        ).map((l) => {
          return (
            <div
              key={l.code}
              className={`lang-row ${active === l.code ? "active" : ""}`}
              onClick={() => setActive(l.code)}
            >
              <div className="flag">{l.code.toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="nm">{l.label}</div>
                <div className="sub">{l.region}</div>
              </div>
            </div>
          );
        })}
      </aside>

      <div className="prompt-editor">
        <div className="prompt-editor-head">
          <div>
            <h2>
              {lang.label}{" "}
              <span
                style={{
                  color: "var(--ink-4)",
                  fontFamily: "var(--mono)",
                  fontSize: 13,
                  fontWeight: 400,
                  marginLeft: 4,
                }}
              >
                {lang.region}
              </span>
            </h2>
            <div className="sub">
              Prompt used for every EN → {lang.code.toUpperCase()} translation.
              Supports {"{{field_name}}"}, {"{{doc_type}}"}, {"{{source_text}}"}
              .
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span
              style={{
                fontSize: 11,
                color: saveState === "error" ? "var(--err)" : "var(--ink-4)",
                fontFamily: "var(--mono)",
              }}
            >
              {saveState === "saving"
                ? "Saving…"
                : saveState === "saved"
                  ? "Saved to data/prompts.json"
                  : saveState === "error"
                    ? (saveError ?? "Save failed")
                    : dirty
                      ? "Unsaved changes"
                      : "Saved"}
            </span>
            <button
              className="btn"
              onClick={onDiscard}
              disabled={!dirty || saveState === "saving"}
            >
              Discard
            </button>
            <button
              className="btn primary"
              onClick={onSave}
              disabled={!dirty || saveState === "saving"}
            >
              <IcCheck /> Save
            </button>
          </div>
        </div>

        <div className="prompt-body">
          <div className="prompt-main">
            <div
              className="section-label"
              style={{ display: "flex", alignItems: "center", gap: 10 }}
            >
              <span>Special rules</span>
              <span
                style={{
                  fontSize: 10.5,
                  color: "var(--ink-4)",
                  fontFamily: "var(--mono)",
                  textTransform: "none",
                  letterSpacing: 0,
                }}
              >
                {p.specialRules.length} rule
                {p.specialRules.length === 1 ? "" : "s"} · one per line · blank
                lines are preserved
              </span>
            </div>
            <textarea
              className="prompt-ta"
              value={rulesText}
              onChange={(e) => setRulesText(e.target.value)}
              rows={28}
              spellCheck={false}
              style={{
                fontFamily: "var(--mono)",
                fontSize: 12.5,
                lineHeight: 1.55,
              }}
              placeholder={
                p.specialRules.length === 0
                  ? `No rules yet for ${lang.label}. Add one rule per line — e.g.\nTARGET LANGUAGE: ${lang.label}.\n- Keep brand and collection names in English.`
                  : undefined
              }
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 8,
              }}
            >
              <button
                className="btn sm ghost"
                onClick={() => update("specialRules", [...p.specialRules, ""])}
              >
                <IcPlus size={11} /> Append blank line
              </button>
              <button
                className="btn sm ghost"
                onClick={() => update("specialRules", [])}
                disabled={p.specialRules.length === 0}
              >
                <IcX size={11} /> Clear all
              </button>
            </div>
          </div>

          <aside className="prompt-aside">
            <div className="section-label">Preview</div>
            <div
              style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 10 }}
            >
              Paste any English text to test the rules currently in the editor.
              Uses your unsaved edits - does not write to Sanity.
            </div>

            <div className="preview-card">
              <div className="hd">
                <LangChip code="en" source />
                <span className="ttl">Source</span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontFamily: "var(--mono)",
                    fontSize: 10.5,
                    color: "var(--ink-4)",
                  }}
                >
                  {previewText.trim()
                    ? `${previewText.trim().split(/\s+/).length} words`
                    : "paste below"}
                </span>
              </div>
              <textarea
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                placeholder="Paste English text here to test the prompt..."
                rows={5}
                spellCheck={false}
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  padding: "8px 10px",
                  fontFamily: "inherit",
                  fontSize: 12.5,
                  lineHeight: 1.55,
                  resize: "vertical",
                  background: "transparent",
                  color: "var(--ink)",
                }}
              />
              {(previewResult || previewError || previewLoading) && (
                <div
                  className="row"
                  style={{ borderTop: "1px solid var(--line)" }}
                >
                  <div className="lbl">
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <LangChip code={active} /> Output
                    </span>
                  </div>
                  <div
                    className="val"
                    style={{ color: previewError ? "var(--err)" : undefined }}
                  >
                    {previewLoading
                      ? "Translating…"
                      : previewError
                        ? previewError
                        : previewResult?.translation}
                  </div>
                </div>
              )}
            </div>

            <button
              className="btn primary"
              style={{ width: "100%", justifyContent: "center", marginTop: 10 }}
              onClick={onRunPreview}
              disabled={previewLoading || !previewText.trim()}
            >
              <IcPlay size={12} /> {previewLoading ? "Running…" : "Run preview"}
            </button>

            {previewResult && previewResult.notes.length > 0 && (
              <>
                <div
                  className="section-label"
                  style={{ marginTop: 14, marginBottom: 6 }}
                >
                  Translation notes
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    fontSize: 12,
                    color: "var(--ink-2)",
                    lineHeight: 1.5,
                  }}
                >
                  {previewResult.notes.map((note, i) => (
                    <div key={i}>— {note}</div>
                  ))}
                </div>
              </>
            )}

            {previewResult && (
              <div
                style={{
                  marginTop: 10,
                  fontSize: 11,
                  fontFamily: "var(--mono)",
                  color: "var(--ink-4)",
                }}
              >
                model: claude-opus-4-7 · {previewResult.usage.inputTokens} in ·{" "}
                {previewResult.usage.outputTokens} out
                {previewResult.usage.cacheReadTokens > 0 &&
                  ` · ${previewResult.usage.cacheReadTokens} cached`}
              </div>
            )}

            <hr className="sep" />

            <div className="section-label">Applies to</div>
            <div
              style={{ fontSize: 12, color: "var(--ink-3)", lineHeight: 1.6 }}
            >
              <div>
                —{" "}
                {
                  docs.filter((d) => d.langs[active].status !== "approved")
                    .length
                }{" "}
                documents currently out-of-date
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
