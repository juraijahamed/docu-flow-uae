import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  computeTotals,
  deleteInvoice,
  formatAED,
  getInvoice,
  saveInvoice,
  useCompany,
  type Invoice,
} from "@/lib/invoices-store";

export const Route = createFileRoute("/invoices/$id")({
  head: () => ({
    meta: [
      { title: "Invoice — Quick Typing" },
      { name: "description", content: "Invoice details and print view." },
    ],
  }),
  component: InvoiceView,
});

function InvoiceView() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const company = useCompany();
  const [inv, setInv] = useState<Invoice | undefined>(undefined);

  useEffect(() => {
    setInv(getInvoice(id));
  }, [id]);

  if (!inv) {
    return (
      <div className="rounded-lg border border-border/60 bg-card p-8 text-center">
        <div className="text-lg font-semibold">Invoice not found</div>
        <p className="mt-1 text-sm text-muted-foreground">
          It may have been deleted.
        </p>
        <Button asChild className="mt-4">
          <Link to="/">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  const totals = computeTotals(inv);

  function updateStatus(status: Invoice["status"]) {
    if (!inv) return;
    const next = { ...inv, status };
    saveInvoice(next);
    setInv(next);
    toast.success(`Marked as ${status}`);
  }

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/" className="text-sm text-muted-foreground hover:underline">
            ← Back to dashboard
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Invoice {inv.number}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={inv.status} onValueChange={(v) => updateStatus(v as Invoice["status"])}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => window.print()}>
            Print / PDF
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              if (confirm(`Delete invoice ${inv.number}?`)) {
                deleteInvoice(inv.id);
                toast.success("Invoice deleted");
                navigate({ to: "/" });
              }
            }}
          >
            Delete
          </Button>
        </div>
      </div>

      <article className="print-area mx-auto max-w-[820px] rounded-xl border border-border/60 bg-card p-8 shadow-sm md:p-12">
        <header className="flex flex-col gap-6 border-b border-border/60 pb-6 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground text-lg font-bold">
                Q
              </div>
              <div>
                <div className="text-xl font-bold tracking-tight">
                  {company.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {company.tagline}
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-0.5 text-xs text-muted-foreground">
              <div>{company.address}</div>
              <div>{company.phone}</div>
              <div>
                {company.email} · {company.website}
              </div>
              {company.trn && <div>TRN: {company.trn}</div>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold tracking-tight text-primary">
              TAX INVOICE
            </div>
            <div className="mt-2 text-sm">
              <div>
                <span className="text-muted-foreground">No: </span>
                <span className="font-semibold">{inv.number}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Date: </span>
                {new Date(inv.issueDate).toLocaleDateString("en-AE")}
              </div>
              {inv.dueDate && (
                <div>
                  <span className="text-muted-foreground">Due: </span>
                  {new Date(inv.dueDate).toLocaleDateString("en-AE")}
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="grid gap-6 py-6 md:grid-cols-2">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Bill To
            </div>
            <div className="mt-2 font-semibold">{inv.client.name}</div>
            {inv.client.address && (
              <div className="text-sm text-muted-foreground">
                {inv.client.address}
              </div>
            )}
            {inv.client.phone && (
              <div className="text-sm">{inv.client.phone}</div>
            )}
            {inv.client.email && (
              <div className="text-sm">{inv.client.email}</div>
            )}
            {inv.client.trn && (
              <div className="text-sm text-muted-foreground">
                TRN: {inv.client.trn}
              </div>
            )}
          </div>
          <div className="md:text-right">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Amount Due
            </div>
            <div className="mt-2 text-3xl font-bold text-primary">
              {formatAED(totals.total)}
            </div>
            <div className="text-xs text-muted-foreground">
              Status: {inv.status.toUpperCase()}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-secondary-foreground">
              <tr>
                <th className="p-3 text-left font-semibold">Description</th>
                <th className="p-3 text-right font-semibold w-16">Qty</th>
                <th className="p-3 text-right font-semibold w-28">Price</th>
                <th className="p-3 text-right font-semibold w-32">Amount</th>
              </tr>
            </thead>
            <tbody>
              {inv.items.map((it) => (
                <tr key={it.id} className="border-t border-border/60">
                  <td className="p-3">{it.description}</td>
                  <td className="p-3 text-right">{it.qty}</td>
                  <td className="p-3 text-right">{formatAED(it.price)}</td>
                  <td className="p-3 text-right font-medium">
                    {formatAED(it.qty * it.price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-6 flex justify-end">
          <div className="w-full max-w-xs space-y-2 text-sm">
            <SumRow label="Subtotal" value={formatAED(totals.subtotal)} />
            {totals.discount > 0 && (
              <SumRow
                label="Discount"
                value={`− ${formatAED(totals.discount)}`}
              />
            )}
            <SumRow
              label={`VAT (${inv.vatRate}%)`}
              value={formatAED(totals.vat)}
            />
            <div className="flex items-center justify-between border-t border-border/60 pt-2 text-base font-bold">
              <span>Total (AED)</span>
              <span className="text-primary">{formatAED(totals.total)}</span>
            </div>
          </div>
        </section>

        {(inv.notes || company.iban || company.bankName) && (
          <section className="mt-8 grid gap-6 border-t border-border/60 pt-6 md:grid-cols-2">
            {inv.notes && (
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Notes
                </div>
                <p className="mt-1 text-sm whitespace-pre-line">{inv.notes}</p>
              </div>
            )}
            {(company.bankName || company.iban) && (
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Payment Details
                </div>
                <div className="mt-1 space-y-0.5 text-sm">
                  {company.bankName && <div>{company.bankName}</div>}
                  {company.bankAccount && (
                    <div>Account: {company.bankAccount}</div>
                  )}
                  {company.iban && <div>IBAN: {company.iban}</div>}
                </div>
              </div>
            )}
          </section>
        )}

        <footer className="mt-10 border-t border-border/60 pt-4 text-center text-xs text-muted-foreground">
          This is a computer-generated invoice. {company.name} · {company.website}
        </footer>
      </article>
    </div>
  );
}

function SumRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}