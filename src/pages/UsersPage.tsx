import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, Plus, Search, MoreHorizontal, UserCheck, UserX, Trash2,
  Shield, RefreshCw, Mail, Phone, Key, ShieldCheck, ShieldOff,
  Crown, Edit2, Download,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAppSelector } from "@/store";
import { cn } from "@/lib/utils";

const ROLES = [
  "SUPER_ADMIN",
  "DIRECTOR",
  "MANAGER",
  "WAREHOUSE_STAFF",
  "AGENT",
  "ACCOUNTANT",
  "SUPPORT",
] as const;

type Role = (typeof ROLES)[number];

type User = {
  id: string;
  fullName?: string;
  email?: string;
  phone?: string;
  role: Role;
  status: "ACTIVE" | "SUSPENDED" | "INVITED" | "DELETED";
  tenantId?: string;
  createdAt?: string;
  lastLoginAt?: string;
};

const ROLE_COLORS: Record<Role, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  DIRECTOR: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  MANAGER: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  WAREHOUSE_STAFF: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  AGENT: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  ACCOUNTANT: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  SUPPORT: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "default",
  INVITED: "outline",
  SUSPENDED: "destructive",
  DELETED: "destructive",
};

export default function UsersPage() {
  const currentUser = useAppSelector((s) => s.auth.user);
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  const isDirectorLevel = ["SUPER_ADMIN", "DIRECTOR", "MANAGER"].includes(currentUser?.role ?? "");

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [exporting, setExporting] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [grantOpen, setGrantOpen] = useState<User | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "MANAGER" as Role,
    password: "",
  });

  const [grantForm, setGrantForm] = useState<{ role: Role; status: string }>({
    role: "MANAGER",
    status: "ACTIVE",
  });

  useEffect(() => { document.title = "Users · VMS"; }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/users");
      const arr = Array.isArray(data) ? data : data?.data ?? [];
      setUsers(arr);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const filtered = users.filter((u) => {
    if (u.status === "DELETED") return false;
    const matchSearch =
      !search ||
      u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search);
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchStatus = statusFilter === "all" || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  async function handleCreate() {
    try {
      await api.post("/api/users", {
        tenantId: currentUser?.tenantId,
        fullName: form.fullName,
        email: form.email || undefined,
        phone: form.phone || undefined,
        role: form.role,
        password: form.password,
      });
      toast.success("User created successfully");
      setCreateOpen(false);
      setForm({ fullName: "", email: "", phone: "", role: "MANAGER", password: "" });
      loadUsers();
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? "Failed to create user");
    }
  }

  async function handleGrantAccess() {
    if (!grantOpen) return;
    try {
      await api.post(`/api/users/${grantOpen.id}/grant-access`, {
        role: grantForm.role,
        status: grantForm.status,
      });
      setUsers((u) =>
        u.map((x) =>
          x.id === grantOpen.id
            ? { ...x, role: grantForm.role, status: grantForm.status as User["status"] }
            : x,
        ),
      );
      toast.success(`Access granted: ${grantOpen.fullName ?? "User"} is now ${grantForm.role}`);
      setGrantOpen(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? "Failed to grant access");
    }
  }

  async function handleRevokeAccess() {
    if (!revokeId) return;
    try {
      await api.post(`/api/users/${revokeId}/revoke-access`);
      setUsers((u) =>
        u.map((x) => (x.id === revokeId ? { ...x, status: "SUSPENDED" } : x)),
      );
      toast.success("Access revoked — user suspended");
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? "Failed to revoke access");
    } finally {
      setRevokeId(null);
    }
  }

  async function handleSuspend(userId: string) {
    try {
      await api.post(`/api/users/${userId}/suspend`);
      setUsers((u) => u.map((x) => (x.id === userId ? { ...x, status: "SUSPENDED" } : x)));
      toast.success("User suspended");
    } catch {
      toast.error("Failed to suspend user");
    }
  }

  async function handleActivate(userId: string) {
    try {
      await api.post(`/api/users/${userId}/activate`);
      setUsers((u) => u.map((x) => (x.id === userId ? { ...x, status: "ACTIVE" } : x)));
      toast.success("User activated");
    } catch {
      toast.error("Failed to activate user");
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await api.delete(`/api/users/${deleteId}`);
      setUsers((u) => u.filter((x) => x.id !== deleteId));
      toast.success("User deleted");
    } catch {
      toast.error("Failed to delete user");
    } finally {
      setDeleteId(null);
    }
  }

  async function handleExport() {
    if (exporting) return;
    setExporting(true);
    try {
      const { data } = await api.get("/api/users/export", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `users_${new Date().toISOString().split("T")[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Export downloaded");
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  }

  if (!isDirectorLevel) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <Shield className="h-12 w-12 text-muted-foreground/40" />
        <h2 className="text-lg font-semibold">Access Restricted</h2>
        <p className="text-sm text-muted-foreground">
          You need Director-level access or higher to manage users.
        </p>
      </div>
    );
  }

  const stats = {
    total: users.filter((u) => u.status !== "DELETED").length,
    active: users.filter((u) => u.status === "ACTIVE").length,
    suspended: users.filter((u) => u.status === "SUSPENDED").length,
    invited: users.filter((u) => u.status === "INVITED").length,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isSuperAdmin
              ? "Super Admin — full control over all users, roles, and access"
              : "Manage team members and their roles"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadUsers} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting} className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            {exporting ? "Exporting…" : "Export"}
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, color: "" },
          { label: "Active", value: stats.active, color: "text-green-600" },
          { label: "Suspended", value: stats.suspended, color: "text-destructive" },
          { label: "Invited", value: stats.invited, color: "text-muted-foreground" },
        ].map((s) => (
          <Card key={s.label} className="p-3">
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className={cn("text-2xl font-bold mt-0.5", s.color)}>{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-8 bg-muted/40"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="h-9 w-44">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {ROLES.map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-36">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INVITED">Invited</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} user{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* User grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 rounded-lg bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No users found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((user) => {
            const initials = user.fullName
              ? user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
              : (user.email?.[0] ?? "U").toUpperCase();
            const isSelf = user.id === currentUser?.id;

            return (
              <Card
                key={user.id}
                className={cn(
                  "relative transition-all hover:shadow-md",
                  user.status === "SUSPENDED" && "opacity-60",
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="text-sm bg-primary/10 text-primary font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-sm truncate">
                          {user.fullName ?? "Unnamed"}
                        </span>
                        {isSelf && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">You</Badge>
                        )}
                        {user.role === "SUPER_ADMIN" && (
                          <Crown className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                        )}
                      </div>
                      {user.email && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                        </div>
                      )}
                      {user.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="text-xs text-muted-foreground">{user.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", ROLE_COLORS[user.role])}>
                          {user.role}
                        </span>
                        <Badge variant={STATUS_VARIANT[user.status] ?? "secondary"} className="text-[10px]">
                          {user.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Actions */}
                    {!isSelf && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          {/* Super admin: grant access */}
                          {isSuperAdmin && (
                            <>
                              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
                                Super Admin Actions
                              </DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => {
                                  setGrantForm({ role: user.role, status: user.status });
                                  setGrantOpen(user);
                                }}
                                className="gap-2"
                              >
                                <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
                                Grant / Change Access
                              </DropdownMenuItem>
                              {user.status !== "SUSPENDED" && (
                                <DropdownMenuItem
                                  onClick={() => setRevokeId(user.id)}
                                  className="gap-2 text-destructive focus:text-destructive"
                                >
                                  <ShieldOff className="h-3.5 w-3.5" />
                                  Revoke Access
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                            </>
                          )}

                          {/* Status actions */}
                          {user.status === "ACTIVE" || user.status === "INVITED" ? (
                            <DropdownMenuItem
                              onClick={() => handleSuspend(user.id)}
                              className="gap-2 text-orange-600 focus:text-orange-600"
                            >
                              <UserX className="h-3.5 w-3.5" />
                              Suspend
                            </DropdownMenuItem>
                          ) : user.status === "SUSPENDED" ? (
                            <DropdownMenuItem onClick={() => handleActivate(user.id)} className="gap-2">
                              <UserCheck className="h-3.5 w-3.5" />
                              Activate
                            </DropdownMenuItem>
                          ) : null}

                          {isSuperAdmin && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="gap-2 text-destructive focus:text-destructive"
                                onClick={() => setDeleteId(user.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete User
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create user dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New User
            </DialogTitle>
            <DialogDescription>
              Create a new user account. They will receive an invitation to set up their profile.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Full Name <span className="text-destructive">*</span></Label>
              <Input
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                placeholder="John Doe"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+998 90 123 4567"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm((f) => ({ ...f, role: v as Role }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.filter((r) => isSuperAdmin || r !== "SUPER_ADMIN").map((r) => (
                    <SelectItem key={r} value={r}>
                      <span className={cn("text-xs px-1.5 py-0.5 rounded-full mr-2", ROLE_COLORS[r])}>
                        {r}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Password <span className="text-destructive">*</span></Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Temporary password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.fullName || !form.password}>
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grant Access dialog (Super Admin only) */}
      <Dialog open={grantOpen != null} onOpenChange={(o) => !o && setGrantOpen(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              Grant / Change Access
            </DialogTitle>
            <DialogDescription>
              Change role and status for{" "}
              <strong>{grantOpen?.fullName ?? "this user"}</strong>.
              This takes effect immediately and will be logged.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>New Role</Label>
              <Select
                value={grantForm.role}
                onValueChange={(v) => setGrantForm((f) => ({ ...f, role: v as Role }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      <div className="flex items-center gap-2">
                        {r === "SUPER_ADMIN" && <Crown className="h-3.5 w-3.5 text-purple-500" />}
                        <span>{r}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Account Status</Label>
              <Select
                value={grantForm.status}
                onValueChange={(v) => setGrantForm((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active — can log in</SelectItem>
                  <SelectItem value="INVITED">Invited — pending setup</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended — blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {grantForm.role === "SUPER_ADMIN" && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                ⚠️ Granting SUPER_ADMIN gives full system access including user management, permissions, and all data.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGrantOpen(null)}>Cancel</Button>
            <Button onClick={handleGrantAccess} className="gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              Apply Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke access confirmation */}
      <AlertDialog open={revokeId != null} onOpenChange={(o) => !o && setRevokeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldOff className="h-4 w-4 text-destructive" />
              Revoke Access?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately suspend the user and terminate all their active sessions.
              They will not be able to log in until access is restored.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleRevokeAccess}
            >
              Revoke Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteId != null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user account. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
