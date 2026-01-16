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
      justifyContent="space-between"
      alignItems="center"
      mb={4}
    >
      <Typography variant="h3" component="h1" fontWeight="bold">
        {title}
      </Typography>
      {onActionClick && (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onActionClick}
          size="large"
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
