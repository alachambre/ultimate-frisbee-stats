import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";

interface DeleteGameDialogProps {
  isDeleting: boolean;
  isError: boolean;
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
  opponentName: string;
}

export default function DeleteGameDialog({
  isDeleting,
  isError,
  onClose,
  onConfirm,
  open,
  opponentName,
}: DeleteGameDialogProps) {
  const { t } = useTranslation(["common", "navigation"]);

  return (
    <Dialog fullWidth maxWidth="xs" onClose={onClose} open={open}>
      <DialogTitle>{t("navigation:newUiPages.allGames.deleteGame.title")}</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary" variant="body2">
          {t("navigation:newUiPages.allGames.deleteGame.message", {
            opponentName,
          })}
        </Typography>
        {isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {t("navigation:newUiPages.allGames.deleteGame.error")}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button disabled={isDeleting} onClick={onClose}>
          {t("common:action.cancel")}
        </Button>
        <Button
          color="error"
          disabled={isDeleting}
          onClick={onConfirm}
          variant="contained"
        >
          {isDeleting ? t("common:action.loading") : t("common:action.delete")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
