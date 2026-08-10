"use client";

import { useCallback, useState } from "react";
import { Download, Plus, Share, X } from "lucide-react";
import { useInstallApp } from "@/lib/use-install-app";

/**
 * Dismissible "Add to Home Screen" bar, shown once below the nav on a mobile
 * browser that can install and hasn't already. It never renders on desktop,
 * inside the installed app, or after being dismissed (snoozed ~60 days).
 *
 * Android gets the native install prompt on tap; iOS — which has no
 * programmatic install — expands the Safari Share-sheet steps inline instead.
 */
export default function InstallBanner() {
  const [visible, setVisible] = useState(false);
  const [showSteps, setShowSteps] = useState(false);

  // onAutoPrompt fires once, after a short delay, only when the device is
  // eligible (mobile, not installed, not snoozed, with an install path).
  const install = useInstallApp({ onAutoPrompt: () => setVisible(true) });

  const dismiss = useCallback(() => {
    setVisible(false);
    install.dismiss();
  }, [install]);

  const handleAdd = useCallback(async () => {
    if (install.needsInstructions) {
      // iOS / no native prompt: reveal the manual steps rather than no-op.
      setShowSteps((s) => !s);
      return;
    }
    const accepted = await install.promptInstall();
    // Accepted → `appinstalled` flips isStandalone and this unmounts. Declined
    // → treat as "not now" and snooze so we don't nag on the next visit.
    if (!accepted) dismiss();
  }, [install, dismiss]);

  if (!visible) return null;

  return (
    <div className="border-b border-amber-200/70 bg-amber-50/90 backdrop-blur dark:border-amber-900/40 dark:bg-amber-950/30">
      <div className="mx-auto max-w-7xl px-4 py-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-700 text-white dark:bg-amber-600">
            <Download className="size-4" aria-hidden />
          </span>
          <p className="flex-1 text-sm text-stone-700 dark:text-stone-300">
            Add Wood Wiz to your home screen for quick price checks.
          </p>
          <button
            type="button"
            onClick={handleAdd}
            aria-expanded={install.needsInstructions ? showSteps : undefined}
            className="shrink-0 rounded-md bg-amber-700 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-amber-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-amber-50 dark:bg-amber-600 dark:hover:bg-amber-500 dark:focus-visible:ring-offset-amber-950"
          >
            {install.needsInstructions ? "How" : "Add"}
          </button>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="shrink-0 rounded-md p-1.5 text-stone-500 transition hover:bg-amber-100 hover:text-stone-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:text-stone-400 dark:hover:bg-amber-900/40 dark:hover:text-stone-200"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        {showSteps && (
          <ol className="mt-2 flex flex-col gap-1.5 pl-12 text-sm text-stone-600 dark:text-stone-400">
            <li className="flex items-center gap-2">
              <Share className="size-4 shrink-0 text-amber-700 dark:text-amber-500" aria-hidden />
              <span>
                Tap the{" "}
                <strong className="font-medium text-stone-800 dark:text-stone-200">Share</strong>{" "}
                button in your browser toolbar
              </span>
            </li>
            <li className="flex items-center gap-2">
              <Plus className="size-4 shrink-0 text-amber-700 dark:text-amber-500" aria-hidden />
              <span>
                Choose{" "}
                <strong className="font-medium text-stone-800 dark:text-stone-200">
                  Add to Home Screen
                </strong>
              </span>
            </li>
          </ol>
        )}
      </div>
    </div>
  );
}
