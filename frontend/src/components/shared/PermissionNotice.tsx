import {
  Alert,
  AlertTitle,
  Button,
  type AlertColor,
  type SxProps,
  type Theme,
} from "@mui/material";
import { Link } from "react-router-dom";

interface PermissionNoticeProps {
  title: string;
  description: string;
  severity?: AlertColor;
  actionLabel?: string;
  actionTo?: string;
  sx?: SxProps<Theme>;
}

export default function PermissionNotice({
  title,
  description,
  severity = "info",
  actionLabel,
  actionTo,
  sx,
}: PermissionNoticeProps) {
  return (
    <Alert
      severity={severity}
      sx={sx}
      action={
        actionLabel && actionTo ? (
          <Button component={Link} to={actionTo} color="inherit" size="small">
            {actionLabel}
          </Button>
        ) : undefined
      }
    >
      <AlertTitle>{title}</AlertTitle>
      {description}
    </Alert>
  );
}
