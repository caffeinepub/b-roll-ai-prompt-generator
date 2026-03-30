import type { UserPublic } from "@/../src/backend.d";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Crown,
  MoreHorizontal,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAdminDeleteUser,
  useAdminResetUsage,
  useAdminSetPlan,
  useAdminSetRole,
  useGetAllUsers,
} from "../hooks/useQueries";

interface AdminDashboardProps {
  sessionToken: string | null;
}

const PLAN_DAILY_LIMIT: Record<string, number> = {
  free: 5,
  starter: 30,
  pro: 80,
  elite: 150,
};

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="bg-card border border-border/60 rounded-xl p-5 flex items-center gap-4">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${accent}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground tabular-nums">
          {value}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  if (role === "admin") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/20 text-primary border border-primary/30">
        <Shield className="w-3 h-3" />
        Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted/60 text-muted-foreground border border-border/40">
      <User className="w-3 h-3" />
      User
    </span>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const configs: Record<
    string,
    { label: string; classes: string; icon?: React.ReactNode }
  > = {
    free: {
      label: "Free",
      classes: "bg-muted/60 text-muted-foreground border-border/40",
    },
    starter: {
      label: "Starter",
      classes: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    },
    pro: {
      label: "Pro",
      classes: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    },
    elite: {
      label: "Elite",
      classes: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      icon: <Crown className="w-3 h-3" />,
    },
  };
  const cfg = configs[plan] ?? configs.free;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
        cfg.classes
      }`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

export default function AdminDashboard({ sessionToken }: AdminDashboardProps) {
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: users = [], isLoading, isError } = useGetAllUsers(sessionToken);
  const setAdminPlan = useAdminSetPlan(sessionToken);
  const setRole = useAdminSetRole(sessionToken);
  const resetUsage = useAdminResetUsage(sessionToken);
  const deleteUser = useAdminDeleteUser(sessionToken);

  const filtered = users.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const totalUsers = users.length;
  const paidUsers = users.filter((u) => u.plan !== "free").length;
  const freeUsers = users.filter((u) => u.plan === "free").length;

  const handleSetPlan = async (email: string, plan: string) => {
    try {
      await setAdminPlan.mutateAsync({ email, plan });
      toast.success(`${email} plan updated to ${plan}.`);
    } catch {
      toast.error("Failed to update plan.");
    }
  };

  const handleSetRole = async (email: string, role: string) => {
    try {
      await setRole.mutateAsync({ email, role });
      toast.success(`${email} role updated to ${role}.`);
    } catch {
      toast.error("Failed to update role.");
    }
  };

  const handleResetUsage = async (email: string) => {
    try {
      await resetUsage.mutateAsync(email);
      toast.success(`Usage reset for ${email}.`);
    } catch {
      toast.error("Failed to reset usage.");
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    try {
      await deleteUser.mutateAsync(deleteTarget);
      toast.success(`${deleteTarget} has been deleted.`);
    } catch {
      toast.error("Failed to delete user.");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div data-ocid="admin.panel">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold uppercase tracking-tight text-foreground">
            Admin Dashboard
          </h1>
        </div>
        <p className="text-sm text-muted-foreground ml-12">
          Manage users, subscriptions, and roles
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={<Users className="w-5 h-5 text-primary" />}
          label="Total Users"
          value={totalUsers}
          accent="bg-primary/15 border border-primary/20"
        />
        <StatCard
          icon={<Crown className="w-5 h-5 text-emerald-400" />}
          label="Paid Users (Starter+)"
          value={paidUsers}
          accent="bg-emerald-500/10 border border-emerald-500/20"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-amber-400" />}
          label="Free Users"
          value={freeUsers}
          accent="bg-amber-500/10 border border-amber-500/20"
        />
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          data-ocid="admin.search_input"
          placeholder="Search users by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-muted/30 border-border/60 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/50"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        {isLoading ? (
          <div data-ocid="admin.loading_state" className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 flex-1 bg-muted/50" />
                <Skeleton className="h-4 w-16 bg-muted/50" />
                <Skeleton className="h-4 w-16 bg-muted/50" />
                <Skeleton className="h-4 w-12 bg-muted/50" />
                <Skeleton className="h-8 w-8 rounded-md bg-muted/50" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div data-ocid="admin.error_state" className="p-12 text-center">
            <p className="text-sm text-destructive">
              Failed to load users. You may not have admin permissions.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div data-ocid="admin.empty_state" className="p-12 text-center">
            <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {search ? "No users match your search." : "No users found."}
            </p>
          </div>
        ) : (
          <Table data-ocid="admin.table">
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                  Email
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                  Role
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                  Plan
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                  Usage Today
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-semibold uppercase tracking-wider text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u: UserPublic, idx: number) => {
                const limit = PLAN_DAILY_LIMIT[u.plan] ?? 5;
                return (
                  <TableRow
                    key={u.email}
                    data-ocid={`admin.item.${idx + 1}`}
                    className="border-border/40 hover:bg-muted/20 transition-colors"
                  >
                    <TableCell className="font-medium text-foreground text-sm max-w-[220px] truncate">
                      {u.email}
                    </TableCell>
                    <TableCell>
                      <RoleBadge role={u.role} />
                    </TableCell>
                    <TableCell>
                      <PlanBadge plan={u.plan} />
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="text-muted-foreground tabular-nums">
                        {Number(u.requestsToday)}
                        <span className="text-muted-foreground/50">
                          /{limit}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          data-ocid={`admin.row.dropdown_menu.${idx + 1}`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-border/50 bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                          aria-label="Row actions"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-card border-border/60 text-foreground min-w-[180px]"
                        >
                          {/* Plan management */}
                          <DropdownMenuItem
                            data-ocid={`admin.row.set_free.${idx + 1}`}
                            className={`cursor-pointer ${
                              u.plan === "free"
                                ? "text-muted-foreground/50 pointer-events-none"
                                : ""
                            }`}
                            onClick={() =>
                              u.plan !== "free" &&
                              handleSetPlan(u.email, "free")
                            }
                          >
                            <span className="w-3.5 h-3.5 mr-2 inline-flex items-center justify-center text-[9px] font-bold rounded-sm bg-muted/60 text-muted-foreground">
                              F
                            </span>
                            Set Free
                            {u.plan === "free" && (
                              <span className="ml-auto text-[10px] text-primary">
                                ✓
                              </span>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            data-ocid={`admin.row.set_starter.${idx + 1}`}
                            className={`cursor-pointer ${
                              u.plan === "starter"
                                ? "text-blue-400 pointer-events-none"
                                : "text-blue-400/80 focus:text-blue-300 focus:bg-blue-500/10"
                            }`}
                            onClick={() =>
                              u.plan !== "starter" &&
                              handleSetPlan(u.email, "starter")
                            }
                          >
                            <TrendingUp className="w-3.5 h-3.5 mr-2" />
                            Set Starter
                            {u.plan === "starter" && (
                              <span className="ml-auto text-[10px]">✓</span>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            data-ocid={`admin.row.set_pro.${idx + 1}`}
                            className={`cursor-pointer ${
                              u.plan === "pro"
                                ? "text-emerald-400 pointer-events-none"
                                : "text-emerald-400/80 focus:text-emerald-300 focus:bg-emerald-500/10"
                            }`}
                            onClick={() =>
                              u.plan !== "pro" && handleSetPlan(u.email, "pro")
                            }
                          >
                            <Crown className="w-3.5 h-3.5 mr-2" />
                            Set Pro
                            {u.plan === "pro" && (
                              <span className="ml-auto text-[10px]">✓</span>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            data-ocid={`admin.row.set_elite.${idx + 1}`}
                            className={`cursor-pointer ${
                              u.plan === "elite"
                                ? "text-amber-400 pointer-events-none"
                                : "text-amber-400/80 focus:text-amber-300 focus:bg-amber-500/10"
                            }`}
                            onClick={() =>
                              u.plan !== "elite" &&
                              handleSetPlan(u.email, "elite")
                            }
                          >
                            <Crown className="w-3.5 h-3.5 mr-2" />
                            Set Elite
                            {u.plan === "elite" && (
                              <span className="ml-auto text-[10px]">✓</span>
                            )}
                          </DropdownMenuItem>

                          <DropdownMenuSeparator className="bg-border/40" />

                          {/* Role */}
                          {u.role === "user" ? (
                            <DropdownMenuItem
                              data-ocid={`admin.row.make_admin.${idx + 1}`}
                              className="cursor-pointer"
                              onClick={() => handleSetRole(u.email, "admin")}
                            >
                              <Shield className="w-3.5 h-3.5 mr-2 text-primary" />
                              Make Admin
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              data-ocid={`admin.row.remove_admin.${idx + 1}`}
                              className="cursor-pointer"
                              onClick={() => handleSetRole(u.email, "user")}
                            >
                              <User className="w-3.5 h-3.5 mr-2" />
                              Remove Admin
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator className="bg-border/40" />

                          {/* Reset usage */}
                          <DropdownMenuItem
                            data-ocid={`admin.row.reset_usage.${idx + 1}`}
                            className="cursor-pointer"
                            onClick={() => handleResetUsage(u.email)}
                          >
                            <RefreshCw className="w-3.5 h-3.5 mr-2" />
                            Reset Usage
                          </DropdownMenuItem>

                          <DropdownMenuSeparator className="bg-border/40" />

                          {/* Delete */}
                          <DropdownMenuItem
                            data-ocid={`admin.row.delete_button.${idx + 1}`}
                            className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                            onClick={() => setDeleteTarget(u.email)}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent
          data-ocid="admin.delete.dialog"
          className="bg-card border-border"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Delete User
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to permanently delete{" "}
              <span className="text-foreground font-medium">
                {deleteTarget}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="admin.delete.cancel_button"
              className="bg-muted/30 border-border/60 text-foreground hover:bg-muted/60"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="admin.delete.confirm_button"
              onClick={handleDeleteUser}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
