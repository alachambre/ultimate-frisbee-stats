import { useState, type FormEvent } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import type { ManagedUser, ManagedUserCreate, ManagedUserRole, ManagedUserUpdate } from "../../types";

interface UserFormDialogProps {
  open: boolean;
  mode: "create" | "edit";
  user?: ManagedUser | null;
  isPending: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSubmit: (payload: ManagedUserCreate | ManagedUserUpdate) => Promise<void> | void;
}

const ROLE_OPTIONS: ManagedUserRole[] = [
  "team_member",
  "team_analyst",
  "admin",
];

export default function UserFormDialog({
  open,
  mode,
  user,
  isPending,
  errorMessage,
  onClose,
  onSubmit,
}: UserFormDialogProps) {
  const { t } = useTranslation("common");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<ManagedUserRole>(user?.role ?? "team_member");
  const [isActive, setIsActive] = useState(user?.is_active ?? true);

  const isCreateMode = mode === "create";
  const trimmedEmail = email.trim();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isCreateMode) {
      await onSubmit({
        email: trimmedEmail,
        password,
        role,
        is_active: isActive,
      });
      return;
    }

    const payload: ManagedUserUpdate = {};
    if (user && trimmedEmail !== user.email) {
      payload.email = trimmedEmail;
    }
    if (password) {
      payload.password = password;
    }
    if (user && role !== user.role) {
      payload.role = role;
    }
    if (user && isActive !== user.is_active) {
      payload.is_active = isActive;
    }

    await onSubmit(payload);
  };

  return (
    <Dialog open={open} onClose={isPending ? undefined : onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {isCreateMode
            ? t("adminUsers.createDialog.title")
            : t("adminUsers.editDialog.title")}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {isCreateMode
                ? t("adminUsers.createDialog.description")
                : t("adminUsers.editDialog.description")}
            </Typography>

            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

            <TextField
              type="email"
              label={t("adminUsers.fields.email")}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              autoFocus
              fullWidth
              required
            />

            <TextField
              type="password"
              label={
                isCreateMode
                  ? t("adminUsers.fields.password")
                  : t("adminUsers.fields.newPassword")
              }
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={isCreateMode ? "new-password" : "off"}
              fullWidth
              required={isCreateMode}
              helperText={
                isCreateMode
                  ? t("adminUsers.fields.passwordHelp")
                  : t("adminUsers.fields.newPasswordHelp")
              }
            />

            <FormControl fullWidth>
              <InputLabel>{t("adminUsers.fields.role")}</InputLabel>
              <Select
                value={role}
                label={t("adminUsers.fields.role")}
                onChange={(event) => setRole(event.target.value as ManagedUserRole)}
              >
                {ROLE_OPTIONS.map((roleOption) => (
                  <MenuItem key={roleOption} value={roleOption}>
                    {t(`access.roles.${roleOption}`)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={isActive}
                  onChange={(event) => setIsActive(event.target.checked)}
                />
              }
              label={t("adminUsers.fields.active")}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isPending}>
            {t("action.cancel")}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={
              isPending ||
              trimmedEmail.length === 0 ||
              (isCreateMode && password.length < 8)
            }
          >
            {isPending
              ? t("action.saving")
              : isCreateMode
                ? t("adminUsers.createDialog.submit")
                : t("adminUsers.editDialog.submit")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
