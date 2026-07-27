import { CalendarClock, CheckCircle2, Clock, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  COLOR_FAMILY_OPTIONS,
  DESIGN_TYPE_OPTIONS,
  LENGTH_OPTIONS,
  SHAPE_OPTIONS,
} from "@/lib/types";
import type { Customer, JobWithCustomer } from "@/lib/types";

function optionLabel<T extends string>(
  options: { value: T; label: string }[],
  value: T
) {
  return options.find((o) => o.value === value)?.label ?? value;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

interface DashboardProps {
  jobs: JobWithCustomer[];
  customers: Customer[];
}

export function ManagerDashboard({ jobs, customers }: DashboardProps) {
  const pending = jobs.filter((j) => j.status === "pending").length;
  const inProgress = jobs.filter((j) => j.status === "accepted").length;
  const completed = jobs.filter((j) => j.status === "completed").length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">
        Today&apos;s Overview
      </h1>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<Clock className="size-5" />} label="Pending" value={pending} />
        <StatCard
          icon={<CalendarClock className="size-5" />}
          label="In Progress"
          value={inProgress}
        />
        <StatCard
          icon={<CheckCircle2 className="size-5" />}
          label="Completed"
          value={completed}
        />
        <StatCard
          icon={<Users className="size-5" />}
          label="New Customers"
          value={customers.length}
        />
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Today&apos;s Jobs ({jobs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <p className="text-muted-foreground">No jobs yet today.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Shape</TableHead>
                  <TableHead>Length</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Design</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>{formatTime(job.created_at)}</TableCell>
                    <TableCell className="font-medium">
                      {job.customer?.name ?? "Walk-in"}
                    </TableCell>
                    <TableCell>{optionLabel(SHAPE_OPTIONS, job.shape)}</TableCell>
                    <TableCell>{optionLabel(LENGTH_OPTIONS, job.length)}</TableCell>
                    <TableCell>
                      {optionLabel(COLOR_FAMILY_OPTIONS, job.color_family)}
                    </TableCell>
                    <TableCell>
                      {optionLabel(DESIGN_TYPE_OPTIONS, job.design_type)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          job.status === "pending"
                            ? "warning"
                            : job.status === "accepted"
                              ? "coral"
                              : job.status === "completed"
                                ? "success"
                                : "danger"
                        }
                      >
                        {job.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Customers ({customers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <p className="text-muted-foreground">No new customers yet today.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.phone ?? "—"}</TableCell>
                    <TableCell>{customer.notes ?? "—"}</TableCell>
                    <TableCell>{formatTime(customer.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
