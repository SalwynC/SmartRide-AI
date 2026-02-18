declare module "use-sync-external-store/shim" {
  import type { useSyncExternalStore as useSyncExternalStoreType } from "react";

  const shim: typeof useSyncExternalStoreType;
  export default shim;
}
