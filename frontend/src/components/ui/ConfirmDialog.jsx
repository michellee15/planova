import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Icon from "./Icon";
import { getPreferences } from "../../utils/preferences";
import { ConfirmDialogContext } from "./confirmDialogContext";

export function ConfirmDialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolverRef = useRef(null);

  const confirm = useCallback((options = {}) => {
    if (options.destructive && !getPreferences().confirmDeletes) {
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialog({
        title: options.title || "Are you sure?",
        description: options.description || "Please confirm this action.",
        confirmLabel: options.confirmLabel || "Confirm",
        cancelLabel: options.cancelLabel || "Cancel",
        destructive: Boolean(options.destructive),
      });
    });
  }, []);

  const closeDialog = (result) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setDialog(null);
  };

  useEffect(() => {
    if (!dialog) return undefined;
    const handleEscape = (event) => {
      if (event.key === "Escape") closeDialog(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [dialog]);

  return (
    <ConfirmDialogContext.Provider value={confirm}>
      {children}
      {dialog && (
        <div
          className="confirm-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDialog(false);
          }}
        >
          <section
            className="confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-description"
          >
            <span
              className={`confirm-icon${dialog.destructive ? " destructive" : ""}`}
            >
              <Icon name={dialog.destructive ? "trash" : "sparkle"} size={22} />
            </span>
            <h2 id="confirm-title">{dialog.title}</h2>
            <p id="confirm-description">{dialog.description}</p>
            <div className="confirm-actions">
              <button
                className="btn btn-secondary"
                type="button"
                autoFocus
                onClick={() => closeDialog(false)}
              >
                {dialog.cancelLabel}
              </button>
              <button
                className={`btn ${dialog.destructive ? "btn-danger" : "btn-primary"}`}
                type="button"
                onClick={() => closeDialog(true)}
              >
                {dialog.confirmLabel}
              </button>
            </div>
          </section>
        </div>
      )}
    </ConfirmDialogContext.Provider>
  );
}
