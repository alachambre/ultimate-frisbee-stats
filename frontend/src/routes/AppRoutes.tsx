import LegacyUiRoutes from "../legacy-ui/routes/LegacyUiRoutes";
import { useUiMode } from "../uiMode/useUiMode";
import DefaultRoutes from "./DefaultRoutes";

export default function AppRoutes() {
  const { uiMode } = useUiMode();

  return uiMode === "old" ? <LegacyUiRoutes /> : <DefaultRoutes />;
}
