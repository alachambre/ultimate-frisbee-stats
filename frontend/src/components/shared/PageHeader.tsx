import { Box, Typography, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

interface PageHeaderProps {
  title: string;
  actionLabel?: string;
  onActionClick?: () => void;
}

export default function PageHeader({
  title,
  actionLabel = "Add",
  onActionClick,
}: PageHeaderProps) {
  return (
    <Box
      display="flex"
      flexDirection={{ xs: "column", sm: "row" }}
      justifyContent="space-between"
      alignItems={{ xs: "stretch", sm: "center" }}
      gap={2}
      mb={4}
    >
      <Typography
        variant="h4"
        component="h1"
        fontWeight="bold"
        sx={{
          fontSize: { xs: "1.75rem", sm: "2.125rem" },
        }}
      >
        {title}
      </Typography>
      {onActionClick && (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onActionClick}
          size="large"
          sx={{
            whiteSpace: "nowrap",
            minWidth: { xs: "100%", sm: "auto" },
          }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
