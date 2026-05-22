import NewUiRoutes from "../new-ui/NewUiRoutes";
import { useUiMode } from "../uiMode/useUiMode";
import OldUiRoutes from "./OldUiRoutes";

export default function AppRoutes() {
  const { uiMode } = useUiMode();

  return uiMode === "new" ? <NewUiRoutes /> : <OldUiRoutes />;
}
