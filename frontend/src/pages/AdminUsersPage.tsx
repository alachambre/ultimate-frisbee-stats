import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";

import UserFormDialog from "../components/admin/UserFormDialog";
import ErrorState from "../components/shared/ErrorState";
import LoadingState from "../components/shared/LoadingState";
import PageHeader from "../components/shared/PageHeader";
import PermissionNotice from "../components/shared/PermissionNotice";
import { useAuth } from "../auth";
import { createManagedUser, getUsers, updateManagedUser } from "../services";
import type { ManagedUser, ManagedUserCreate, ManagedUserUpdate } from "../types";
import { formatDate } from "../utils/dateFormatting";
import { queryKeys } from "../utils/queryKeys";

function getMutationErrorMessage(error: unknown): string | null {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object" &&
    "detail" in error.response.data &&
    typeof error.response.data.detail === "string"
  ) {
    return error.response.data.detail;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return null;
}

export default function AdminUsersPage() {
  const auth = useAuth();
  const { t, i18n } = useTranslation("common");
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);

  const {
    data: users,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.users,
    queryFn: () => getUsers(),
  });

  const createMutation = useMutation({
    mutationFn: (payload: ManagedUserCreate) => createManagedUser(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.users });
      setIsCreateDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: number;
      payload: ManagedUserUpdate;
    }) => updateManagedUser(userId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.users });
      setEditingUser(null);
    },
  });

  const sortedUsers = useMemo(
    () =>
      [...(users ?? [])].sort((left, right) => {
        if (left.is_active !== right.is_active) {
          return left.is_active ? -1 : 1;
        }
        return left.email.localeCompare(right.email);
      }),
    [users]
  );

  if (isLoading) {
    return <LoadingState message={t("action.loading")} />;
  }

  if (error) {
    return <ErrorState message={t("messages.error")} />;
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <PageHeader
        title={t("adminUsers.title")}
        actionLabel={t("adminUsers.addUser")}
        onActionClick={() => setIsCreateDialogOpen(true)}
      />

      <PermissionNotice
        title={t("adminUsers.noticeTitle")}
        description={t("adminUsers.noticeDescription")}
        severity="info"
        sx={{ mb: 3 }}
      />

      {sortedUsers.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="body1" color="text.secondary" mb={2}>
            {t("adminUsers.empty")}
          </Typography>
          <Button variant="contained" onClick={() => setIsCreateDialogOpen(true)}>
            {t("adminUsers.addUser")}
          </Button>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {sortedUsers.map((user) => (
            <Paper key={user.id} sx={{ p: 3 }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems={{ xs: "stretch", sm: "center" }}
                flexDirection={{ xs: "column", sm: "row" }}
                gap={2}
              >
                <Box>
                  <Box display="flex" gap={1} flexWrap="wrap" alignItems="center" mb={1}>
                    <Typography variant="h6" fontWeight="bold">
                      {user.email}
                    </Typography>
                    <Chip
                      label={t(`access.roles.${user.role}`)}
                      color={user.role === "admin" ? "secondary" : "default"}
                      size="small"
                    />
                    <Chip
                      label={
                        user.is_active
                          ? t("adminUsers.status.active")
                          : t("adminUsers.status.inactive")
                      }
                      color={user.is_active ? "success" : "default"}
                      size="small"
                    />
                    {auth.authUserId === user.auth_user_id && (
                      <Chip label={t("adminUsers.status.currentAccount")} size="small" />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {t("adminUsers.meta.created", {
                      date: formatDate(user.created_at, i18n.resolvedLanguage),
                    })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t("adminUsers.meta.updated", {
                      date: formatDate(user.updated_at, i18n.resolvedLanguage),
                    })}
                  </Typography>
                </Box>
                <Box>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => setEditingUser(user)}
                  >
                    {t("action.edit")}
                  </Button>
                </Box>
              </Box>
            </Paper>
          ))}
        </Stack>
      )}

      <UserFormDialog
        key="create-user"
        open={isCreateDialogOpen}
        mode="create"
        isPending={createMutation.isPending}
        errorMessage={getMutationErrorMessage(createMutation.error)}
        onClose={() => {
          createMutation.reset();
          setIsCreateDialogOpen(false);
        }}
        onSubmit={async (payload) => {
          await createMutation.mutateAsync(payload as ManagedUserCreate);
        }}
      />

      {editingUser && (
        <UserFormDialog
          key={`edit-user-${editingUser.id}`}
          open={!!editingUser}
          mode="edit"
          user={editingUser}
          isPending={updateMutation.isPending}
          errorMessage={getMutationErrorMessage(updateMutation.error)}
          onClose={() => {
            updateMutation.reset();
            setEditingUser(null);
          }}
          onSubmit={async (payload) => {
            await updateMutation.mutateAsync({
              userId: editingUser.id,
              payload: payload as ManagedUserUpdate,
            });
          }}
        />
      )}
    </Container>
  );
}
