import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  computeTotals,
  formatAED,
  useInvoiceList,
  useCompany,
  deleteInvoice,
  type Invoice,
} from "@/lib/invoices-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Invoice Dashboard — Quick Documents Clearing" },
      { name: "description", content: "Create and manage VAT invoices for Quick Documents Clearing." },
      { property: "og:title", content: "Invoice Dashboard — Quick Documents Clearing" },
      { property: "og:description", content: "Create and manage VAT invoices for Quick Documents Clearing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const invoices = useInvoiceList();
  const company = useCompany();

  const stats = useMemo(() => {
    let revenue = 0;
    let outstanding = 0;
    let paidCount = 0;
    for (const inv of invoices) {
      const { total } = computeTotals(inv);
      if (inv.status === "paid") {
        revenue += total;
        paidCount += 1;
      } else {
        outstanding += total;
      }
    }
    return {
      revenue,
      outstanding,
      paidCount,
      count: invoices.length,
    };
  }, [invoices]);

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {company.name}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Create, track and print VAT-ready invoices for your typing and document clearing services.
          </p>
        </div>
        <Button asChild size="lg" className="shadow-sm">
          <Link to="/invoices/new">+ New Invoice</Link>
        </Button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Revenue" value={formatAED(stats.revenue)} accent />
        <StatCard label="Outstanding" value={formatAED(stats.outstanding)} />
        <StatCard label="Paid Invoices" value={String(stats.paidCount)} />
        <StatCard label="All Invoices" value={String(stats.count)} />
      </section>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Invoices</CardTitle>
          {invoices.length > 0 && (
            <span className="text-sm text-muted-foreground">
              Showing {Math.min(invoices.length, 20)} of {invoices.length}
            </span>
          )}
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.slice(0, 20).map((inv) => (
                    <InvoiceRow key={inv.id} inv={inv} />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <Card
      className={
        accent
          ? "border-primary/30 bg-gradient-to-br from-primary/10 to-transparent"
          : ""
      }
    >
      <CardContent className="p-5">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="mt-2 text-2xl font-bold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
}

function InvoiceRow({ inv }: { inv: Invoice }) {
  const { total } = computeTotals(inv);
  return (
    <TableRow>
      <TableCell className="font-medium">{inv.number}</TableCell>
      <TableCell>{inv.client.name || "—"}</TableCell>
      <TableCell>{new Date(inv.issueDate).toLocaleDateString("en-AE")}</TableCell>
      <TableCell>
        <StatusBadge status={inv.status} />
      </TableCell>
      <TableCell className="text-right font-medium">{formatAED(total)}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to="/invoices/$id" params={{ id: inv.id }}>
              View
            </Link>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (confirm(`Delete invoice ${inv.number}?`)) {
                deleteInvoice(inv.id);
                toast.success("Invoice deleted");
              }
            }}
          >
            Delete
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function StatusBadge({ status }: { status: Invoice["status"] }) {
  const map: Record<Invoice["status"], { label: string; className: string }> = {
    draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
    sent: { label: "Sent", className: "bg-accent/40 text-accent-foreground" },
    paid: {
      label: "Paid",
      className: "bg-primary/10 text-primary border border-primary/30",
    },
  };
  const s = map[status];
  return <Badge className={s.className} variant="secondary">{s.label}</Badge>;
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      <div className="text-4xl">🧾</div>
      <div className="text-lg font-semibold">No invoices yet</div>
      <p className="max-w-md text-sm text-muted-foreground">
        Create your first invoice for a client — takes less than a minute.
      </p>
      <Button asChild className="mt-2">
        <Link to="/invoices/new">Create your first invoice</Link>
      </Button>
    </div>
  );
}
