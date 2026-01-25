import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Container,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  DialogContentText,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import ShieldIcon from "@mui/icons-material/Shield";
import AppsIcon from "@mui/icons-material/Apps";
import { getStrategies, deleteStrategy } from "../services/strategies";
import PageHeader from "../components/shared/PageHeader";
import LoadingState from "../components/shared/LoadingState";
import ErrorState from "../components/shared/ErrorState";
import StrategiesGrid from "../components/strategies/StrategiesGrid";
import EmptyStrategiesState from "../components/strategies/EmptyStrategiesState";
import CreateStrategyModal from "../components/modals/CreateStrategyModal";
import EditStrategyModal from "../components/modals/EditStrategyModal";
import type { Strategy, StrategyCategory } from "../types";

export default function StrategiesPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<StrategyCategory | "all">("all");
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);
  const [deletingStrategy, setDeletingStrategy] = useState<Strategy | null>(null);
  const queryClient = useQueryClient();

  const {
    data: strategies,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["strategies"],
    queryFn: () => getStrategies(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteStrategy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
      setDeletingStrategy(null);
    },
  });

  // Filter and sort strategies by category (alphabetical)
  const filteredStrategies = useMemo(() => {
    if (!strategies) return [];
    const filtered = selectedCategory === "all"
      ? strategies
      : strategies.filter((s) => s.category === selectedCategory);

    // Sort alphabetically by name
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [strategies, selectedCategory]);

  const handleDelete = () => {
    if (deletingStrategy) {
      deleteMutation.mutate(deletingStrategy.id);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading strategies..." />;
  }

  if (error) {
    return <ErrorState message="Error loading strategies. Please try again." />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, px: { xs: 2, sm: 3 } }}>
      <PageHeader
        title="Strategies"
        actionLabel="New Strategy"
        onActionClick={() => setIsCreateModalOpen(true)}
      />

      {/* Category Filter */}
      {strategies && strategies.length > 0 && (
        <Box sx={{ mb: 3, display: "flex", justifyContent: "center" }}>
          <ToggleButtonGroup
            value={selectedCategory}
            exclusive
            onChange={(_, newValue) => {
              if (newValue !== null) {
                setSelectedCategory(newValue as StrategyCategory | "all");
              }
            }}
            aria-label="strategy category filter"
            sx={{
              "& .MuiToggleButton-root": {
                px: 3,
                py: 1,
                textTransform: "none",
                fontWeight: 500,
                "&.Mui-selected": {
                  backgroundColor: "primary.main",
                  color: "white",
                  "&:hover": {
                    backgroundColor: "primary.dark",
                  },
                },
              },
            }}
          >
            <ToggleButton value="all" aria-label="all strategies">
              <AppsIcon sx={{ mr: 1, fontSize: 20 }} />
              All
            </ToggleButton>
            <ToggleButton value="offense" aria-label="offense strategies">
              <FlashOnIcon sx={{ mr: 1, fontSize: 20 }} />
              Offense
            </ToggleButton>
            <ToggleButton value="defense" aria-label="defense strategies">
              <ShieldIcon sx={{ mr: 1, fontSize: 20 }} />
              Defense
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}

      {strategies && strategies.length === 0 ? (
        <EmptyStrategiesState
          onCreateClick={() => setIsCreateModalOpen(true)}
        />
      ) : filteredStrategies.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Box sx={{ color: "text.secondary" }}>
            No strategies found for the selected category
          </Box>
        </Box>
      ) : (
        <StrategiesGrid
          strategies={filteredStrategies}
          onEdit={setEditingStrategy}
          onDelete={setDeletingStrategy}
        />
      )}

      {/* Modals */}
      <CreateStrategyModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <EditStrategyModal
        isOpen={!!editingStrategy}
        onClose={() => setEditingStrategy(null)}
        strategy={editingStrategy}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingStrategy}
        onClose={() => setDeletingStrategy(null)}
      >
        <DialogTitle>Delete Strategy?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{deletingStrategy?.name}"? This action cannot be undone.
            Points that used this strategy will keep their reference but the strategy will be marked as deleted.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletingStrategy(null)} disabled={deleteMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
