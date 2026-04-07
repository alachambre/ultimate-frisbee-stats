import { useState, type FormEvent } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../auth";

interface LoginDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function LoginDialog({ open, onClose }: LoginDialogProps) {
  const { t } = useTranslation("common");
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClose = () => {
    if (auth.isLoading) {
      return;
    }

    setPassword("");
    setErrorMessage(null);
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!auth.isConfigured) {
      setErrorMessage(t("auth.notConfigured"));
      return;
    }

    try {
      await auth.signInWithPassword(email.trim(), password);
      setPassword("");
      onClose();
    } catch (error) {
      const nextErrorMessage =
        error instanceof Error && error.message
          ? error.message
          : t("auth.genericError");
      setErrorMessage(nextErrorMessage);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{t("auth.signInTitle")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {t("auth.signInDescription")}
            </Typography>
            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
            <TextField
              type="email"
              label={t("auth.emailLabel")}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              autoFocus
              fullWidth
              required
            />
            <TextField
              type="password"
              label={t("auth.passwordLabel")}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              fullWidth
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={auth.isLoading}>
            {t("action.cancel")}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={auth.isLoading || !email.trim() || password.length === 0}
          >
            {auth.isLoading ? t("action.loading") : t("auth.submit")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
