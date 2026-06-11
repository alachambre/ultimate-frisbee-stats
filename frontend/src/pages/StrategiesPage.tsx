import { useMemo, useState, type MouseEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import SearchIcon from "@mui/icons-material/Search";
import ShieldIcon from "@mui/icons-material/Shield";
import ViewListIcon from "@mui/icons-material/ViewList";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

import CreateStrategyModal from "../components/modals/CreateStrategyModal";
import EditStrategyModal from "../components/modals/EditStrategyModal";
import ErrorState from "../components/shared/ErrorState";
import LoadingState from "../components/shared/LoadingState";
import { deleteStrategy, getStrategies } from "../services/strategies";
import type { Strategy, StrategyCategory } from "../types";
import { queryKeys } from "../utils/queryKeys";

type StrategyFilter = "all" | StrategyCategory;

function sortStrategies(strategies: Strategy[]): Strategy[] {
  return [...strategies].sort((left, right) =>
    left.name.localeCompare(right.name)
  );
}

interface StrategyTypeIconProps {
  category: StrategyCategory;
}

function StrategyTypeIcon({ category }: StrategyTypeIconProps) {
  const isOffense = category === "offense";

  return (
    <Box
      aria-hidden
      sx={(theme) => ({
        alignItems: "center",
        bgcolor: isOffense
          ? theme.colors.offense.soft
          : theme.colors.defense.soft,
        borderRadius: "50%",
        color: isOffense
          ? theme.colors.offense.main
          : theme.colors.defense.dark,
        display: "inline-flex",
        flex: "0 0 auto",
        height: 40,
        justifyContent: "center",
        width: 40,
      })}
    >
      {isOffense ? <FlashOnIcon /> : <ShieldIcon />}
    </Box>
  );
}

interface StrategyCategoryChipProps {
  category: StrategyCategory;
}

function StrategyCategoryChip({ category }: StrategyCategoryChipProps) {
  const { t } = useTranslation("strategies");
  const isOffense = category === "offense";

  return (
    <Chip
      label={isOffense ? t("form.offense") : t("form.defense")}
      size="small"
      sx={(theme) => ({
        bgcolor: isOffense
          ? theme.colors.offense.soft
          : theme.colors.defense.soft,
        border: `1px solid ${
          isOffense
            ? theme.colors.offense.border
            : theme.colors.defense.border
        }`,
        color: isOffense
          ? theme.colors.offense.main
          : theme.colors.defense.dark,
        fontWeight: 800,
      })}
    />
  );
}

interface StrategyRowProps {
  onDelete: (strategy: Strategy) => void;
  onEdit: (strategy: Strategy) => void;
  strategy: Strategy;
}

function StrategyRow({ onDelete, onEdit, strategy }: StrategyRowProps) {
  const { t } = useTranslation(["strategies", "common"]);
  const description =
    strategy.description?.trim() || t("strategies:page.library.noDescription");

  const handleActionClick =
    (callback: (strategy: Strategy) => void) =>
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      callback(strategy);
    };

  return (
    <Box
      component="article"
      sx={(theme) => ({
        alignItems: "center",
        borderBottom: `1px solid ${theme.palette.divider}`,
        display: "grid",
        gap: { xs: 1, sm: 2 },
        gridTemplateColumns: "minmax(0, 1fr) auto",
        minHeight: { xs: "auto", sm: 84 },
        px: { xs: 1.25, sm: 2 },
        py: { xs: 0, sm: 0 },
        "&:last-of-type": {
          borderBottom: 0,
        },
      })}
    >
      <Box
        aria-label={t("strategies:page.actions.openEditorAria", {
          strategyName: strategy.name,
        })}
        component="button"
        onClick={() => onEdit(strategy)}
        type="button"
        sx={(theme) => ({
          alignItems: "center",
          background: "transparent",
          border: 0,
          borderRadius: 1,
          color: "inherit",
          cursor: "pointer",
          display: "grid",
          gap: { xs: 1.25, sm: 1.75 },
          gridTemplateColumns: {
            xs: "auto minmax(0, 1fr)",
            sm: "auto minmax(0, 1fr) auto",
          },
          minWidth: 0,
          px: { xs: 0.75, sm: 0.5 },
          py: { xs: 1.75, sm: 2 },
          textAlign: "left",
          width: "100%",
          "&:hover": {
            bgcolor: alpha(theme.colors.newUi.primary, 0.04),
          },
          "&:focus-visible": {
            outline: `3px solid ${alpha(theme.colors.newUi.primary, 0.2)}`,
            outlineOffset: 2,
          },
        })}
      >
        <StrategyTypeIcon category={strategy.category} />
        <Box sx={{ minWidth: 0 }}>
          <Typography component="strong" fontWeight={900}>
            {strategy.name}
          </Typography>
          <Typography
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              fontSize: "0.9rem",
              lineHeight: 1.45,
              mt: 0.35,
              overflow: "hidden",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: { xs: 2, sm: 1 },
            }}
          >
            {description}
          </Typography>
        </Box>
        <Box sx={{ gridColumn: { xs: 2, sm: "auto" }, justifySelf: "start" }}>
          <StrategyCategoryChip category={strategy.category} />
        </Box>
      </Box>

      <Stack direction="row" spacing={0.5}>
        <Tooltip title={t("strategies:page.actions.edit")}>
          <IconButton
            aria-label={t("strategies:page.actions.editAria", {
              strategyName: strategy.name,
            })}
            onClick={handleActionClick(onEdit)}
            sx={(theme) => ({
              color: theme.palette.text.secondary,
              "&:hover": {
                bgcolor: alpha(theme.colors.newUi.primary, 0.08),
                color: theme.colors.newUi.primary,
              },
            })}
            type="button"
          >
            <EditIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title={t("common:action.delete")}>
          <IconButton
            aria-label={t("strategies:page.actions.deleteAria", {
              strategyName: strategy.name,
            })}
            onClick={handleActionClick(onDelete)}
            sx={(theme) => ({
              color: theme.palette.text.secondary,
              "&:hover": {
                bgcolor: alpha(theme.palette.error.main, 0.08),
                color: theme.palette.error.main,
              },
            })}
            type="button"
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  );
}

export default function StrategiesPage() {
  const { t } = useTranslation(["strategies", "common"]);
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<StrategyFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);
  const [deletingStrategy, setDeletingStrategy] = useState<Strategy | null>(
    null
  );

  const {
    data: strategies = [],
    error,
    isLoading,
  } = useQuery({
    queryKey: queryKeys.strategies,
    queryFn: () => getStrategies(),
  });

  const deleteMutation = useMutation({
    mutationFn: (strategyId: number) => deleteStrategy(strategyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.strategies });
      setDeletingStrategy(null);
    },
  });

  const strategyCounts = useMemo(
    () => ({
      defense: strategies.filter((strategy) => strategy.category === "defense")
        .length,
      offense: strategies.filter((strategy) => strategy.category === "offense")
        .length,
      total: strategies.length,
    }),
    [strategies]
  );

  const filteredStrategies = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return sortStrategies(
      strategies.filter((strategy) => {
        const matchesCategory =
          activeFilter === "all" || strategy.category === activeFilter;
        const matchesSearch =
          normalizedSearch.length === 0 ||
          strategy.name.toLowerCase().includes(normalizedSearch) ||
          strategy.description?.toLowerCase().includes(normalizedSearch);

        return matchesCategory && matchesSearch;
      })
    );
  }, [activeFilter, searchTerm, strategies]);

  const handleDeleteConfirm = () => {
    if (deletingStrategy === null) {
      return;
    }

    deleteMutation.mutate(deletingStrategy.id);
  };

  if (isLoading) {
    return (
      <LoadingState
        message={t("strategies:page.loading")}
        showColdStartHint={false}
      />
    );
  }

  if (error) {
    return <ErrorState message={t("strategies:page.error")} />;
  }

  const hasStrategies = strategies.length > 0;
  const newUiPrimaryButtonSx = (
    theme: import("@mui/material/styles").Theme
  ) => ({
    bgcolor: theme.colors.newUi.primaryAction,
    boxShadow: `0 3px 8px ${alpha(theme.colors.newUi.primaryAction, 0.22)}`,
    color: theme.colors.newUi.primaryActionText,
    "&:hover": {
      bgcolor: theme.colors.newUi.primaryActionHover,
      boxShadow: `0 4px 10px ${alpha(theme.colors.newUi.primaryAction, 0.28)}`,
    },
  });

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 }, px: { xs: 2, sm: 3 } }}>
      <Box
        component="section"
        aria-labelledby="strategies-title"
        sx={{
          alignItems: "flex-start",
          display: "grid",
          gap: { xs: 2.25, md: 3 },
          gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) auto" },
          mb: 3,
        }}
      >
        <Box>
          <Typography
            color="text.secondary"
            fontSize="0.78rem"
            fontWeight={800}
            letterSpacing="0.08em"
            textTransform="uppercase"
          >
            {t("strategies:page.eyebrow")}
          </Typography>
          <Typography
            component="h1"
            id="strategies-title"
            sx={{
              fontSize: { xs: "2rem", md: "2.75rem" },
              fontWeight: 900,
              letterSpacing: 0,
              lineHeight: 1.05,
              mt: 0.75,
            }}
          >
            {t("strategies:page.title")}
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ lineHeight: 1.5, maxWidth: 680, mt: 1.25 }}
          >
            {t("strategies:page.copy")}
          </Typography>
          <Stack
            aria-label={t("strategies:page.summary.label")}
            direction="row"
            flexWrap="wrap"
            gap={1}
            sx={{ mt: 2.25 }}
          >
            <Chip
              label={t("strategies:page.summary.total", {
                count: strategyCounts.total,
              })}
              sx={(theme) => ({
                bgcolor: theme.colors.newUi.primarySoft,
                border: `1px solid ${theme.colors.newUi.primaryBorder}`,
                color: theme.colors.newUi.primary,
                fontWeight: 800,
              })}
            />
            <Chip
              label={t("strategies:page.summary.offense", {
                count: strategyCounts.offense,
              })}
              variant="outlined"
              sx={{ fontWeight: 800 }}
            />
            <Chip
              label={t("strategies:page.summary.defense", {
                count: strategyCounts.defense,
              })}
              variant="outlined"
              sx={{ fontWeight: 800 }}
            />
          </Stack>
        </Box>

        <Button
          fullWidth
          onClick={() => setIsCreateModalOpen(true)}
          startIcon={<AddIcon />}
          sx={(theme) => ({
            ...newUiPrimaryButtonSx(theme),
            justifySelf: { md: "end" },
            minWidth: { md: 190 },
          })}
          type="button"
          variant="contained"
        >
          {t("strategies:page.newStrategy")}
        </Button>
      </Box>

      <Box
        component="section"
        aria-label={t("strategies:page.filters.label")}
        sx={{
          alignItems: "stretch",
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { xs: "1fr", md: "auto minmax(260px, 1fr)" },
          mb: 2.25,
        }}
      >
        <ToggleButtonGroup
          aria-label={t("strategies:page.filters.categoryAria")}
          exclusive
          onChange={(_, value: StrategyFilter | null) => {
            if (value !== null) {
              setActiveFilter(value);
            }
          }}
          value={activeFilter}
          sx={(theme) => ({
            bgcolor: alpha(theme.colors.newUi.primary, 0.08),
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            p: 0.35,
            width: { xs: "100%", md: "auto" },
            "& .MuiToggleButton-root": {
              border: 0,
              borderRadius: 0.75,
              color: theme.palette.text.secondary,
              flex: { xs: 1, md: "0 0 auto" },
              fontWeight: 800,
              gap: 0.75,
              px: { xs: 1, sm: 1.5 },
              py: 1,
              textTransform: "none",
              "&.Mui-selected": {
                bgcolor: theme.palette.background.paper,
                boxShadow: `0 1px 4px ${alpha(theme.palette.common.black, 0.12)}`,
                color: theme.colors.newUi.primary,
              },
              "&.Mui-selected:hover": {
                bgcolor: theme.palette.background.paper,
              },
            },
          })}
        >
          <ToggleButton value="all">
            <ViewListIcon fontSize="small" />
            {t("strategies:page.filter.all")}
          </ToggleButton>
          <ToggleButton value="offense">
            <FlashOnIcon fontSize="small" />
            {t("strategies:form.offense")}
          </ToggleButton>
          <ToggleButton value="defense">
            <ShieldIcon fontSize="small" />
            {t("strategies:form.defense")}
          </ToggleButton>
        </ToggleButtonGroup>

        <TextField
          fullWidth
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder={t("strategies:page.search.placeholder")}
          size="small"
          value={searchTerm}
          slotProps={{
            htmlInput: {
              "aria-label": t("strategies:page.search.label"),
            },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      <Paper
        component="section"
        elevation={0}
        sx={(theme) => ({
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
          overflow: "hidden",
        })}
      >
        <Box
          sx={(theme) => ({
            bgcolor: alpha(theme.palette.background.paper, 0.72),
            borderBottom: `1px solid ${theme.palette.divider}`,
            px: { xs: 2, sm: 2.5 },
            py: 2,
          })}
        >
          <Typography component="h2" fontWeight={900} variant="h6">
            {t("strategies:page.library.title")}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {t("strategies:page.library.scope")}
          </Typography>
        </Box>

        {!hasStrategies ? (
          <Box sx={{ px: 3, py: 6, textAlign: "center" }}>
            <Typography fontWeight={900} variant="h6">
              {t("strategies:page.empty.title")}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.75 }}>
              {t("strategies:page.empty.description")}
            </Typography>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              startIcon={<AddIcon />}
              sx={(theme) => ({
                ...newUiPrimaryButtonSx(theme),
                mt: 2.5,
              })}
              type="button"
              variant="contained"
            >
              {t("strategies:page.newStrategy")}
            </Button>
          </Box>
        ) : filteredStrategies.length === 0 ? (
          <Box sx={{ px: 3, py: 6, textAlign: "center" }}>
            <Typography fontWeight={900} variant="h6">
              {t("strategies:page.empty.filteredTitle")}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.75 }}>
              {t("strategies:page.empty.filteredDescription")}
            </Typography>
          </Box>
        ) : (
          filteredStrategies.map((strategy) => (
            <StrategyRow
              key={strategy.id}
              onDelete={setDeletingStrategy}
              onEdit={setEditingStrategy}
              strategy={strategy}
            />
          ))
        )}
      </Paper>

      <CreateStrategyModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      <EditStrategyModal
        key={editingStrategy?.id ?? "strategy-editor"}
        isOpen={editingStrategy !== null}
        onClose={() => setEditingStrategy(null)}
        strategy={editingStrategy}
      />
      <Dialog
        fullWidth
        maxWidth="sm"
        onClose={() => setDeletingStrategy(null)}
        open={deletingStrategy !== null}
      >
        <DialogTitle>{t("strategies:card.deleteTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("strategies:page.actions.deleteConfirm", {
              strategyName: deletingStrategy?.name,
            })}
          </DialogContentText>
          {deleteMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {t("strategies:page.actions.deleteError")}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            disabled={deleteMutation.isPending}
            onClick={() => setDeletingStrategy(null)}
            type="button"
          >
            {t("common:action.cancel")}
          </Button>
          <Button
            color="error"
            disabled={deleteMutation.isPending}
            onClick={handleDeleteConfirm}
            type="button"
            variant="contained"
          >
            {deleteMutation.isPending
              ? t("common:action.loading")
              : t("common:action.delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
