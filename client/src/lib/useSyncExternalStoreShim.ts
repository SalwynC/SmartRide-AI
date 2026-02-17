import shim from "use-sync-external-store/shim";

// Ensure named export exists for ESM consumers in dev.
export const useSyncExternalStore =
  (shim as { useSyncExternalStore?: typeof shim }).useSyncExternalStore ?? shim;

export default useSyncExternalStore;
