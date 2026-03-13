import type { BarekeyResolvedRecord } from "@barekey/sdk";

const OVERLAY_ID = "__barekey_private_variable_overlay";

const leakedNames = new Set<string>();

function isBrowserDevelopmentRuntime(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }

  if (
    typeof process !== "undefined" &&
    typeof process.env === "object" &&
    process.env !== null &&
    process.env.NODE_ENV === "production"
  ) {
    return false;
  }

  return true;
}

function renderOverlay(): void {
  if (typeof document === "undefined" || document.body === null) {
    return;
  }

  let overlay = document.getElementById(OVERLAY_ID);
  if (overlay === null) {
    overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    overlay.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:2147483647",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "padding:32px",
      "background:rgba(14,18,28,0.96)",
      "color:#f8fafc",
      "font-family:ui-monospace,SFMono-Regular,Menlo,monospace",
      "white-space:pre-wrap",
    ].join(";");
    document.body.appendChild(overlay);
  }

  if (document.documentElement !== null) {
    document.documentElement.style.overflow = "hidden";
  }

  const orderedNames = [...leakedNames].sort();
  overlay.innerHTML = [
    '<div style="max-width:900px;border:1px solid rgba(248,113,113,0.65);border-radius:20px;background:#111827;padding:28px;box-shadow:0 20px 80px rgba(0,0,0,0.45)">',
    '<div style="font-size:13px;letter-spacing:0.18em;text-transform:uppercase;color:#fca5a5;margin-bottom:12px">Barekey Leak Guard</div>',
    '<div style="font-size:28px;line-height:1.2;font-weight:700;margin-bottom:14px">A private Barekey variable reached the browser.</div>',
    '<div style="font-size:16px;line-height:1.6;color:#cbd5e1;margin-bottom:18px">This usually means a server-only client or private variable was exposed through a client-side React path.</div>',
    `<div style="font-size:15px;line-height:1.7;background:#0f172a;border-radius:14px;padding:16px;border:1px solid rgba(148,163,184,0.25)">Leaked variables:\n${orderedNames.join("\n")}</div>`,
    "</div>",
  ].join("");
}

export function enforcePublicRecords(records: ReadonlyArray<BarekeyResolvedRecord<unknown>>): void {
  if (!isBrowserDevelopmentRuntime()) {
    return;
  }

  const privateNames = records
    .filter((record) => record.visibility === "private")
    .map((record) => record.name);
  if (privateNames.length === 0) {
    return;
  }

  for (const name of privateNames) {
    leakedNames.add(name);
  }

  console.error(
    `[barekey] Private variables leaked to the browser: ${[...leakedNames].sort().join(", ")}`,
  );
  renderOverlay();
}

export function resetLeakGuardForTests(): void {
  leakedNames.clear();

  if (typeof document === "undefined") {
    return;
  }

  document.getElementById(OVERLAY_ID)?.remove();
  if (document.documentElement !== null) {
    document.documentElement.style.overflow = "";
  }
}
