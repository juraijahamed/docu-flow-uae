import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addPreset,
  bumpInvoiceNumber,
  computeTotals,
  formatAED,
  getDefaultVat,
  nextInvoiceNumber,
  removePreset,
  saveDefaultVat,
  saveInvoice,
  useCompany,
  usePresets,
  type Invoice,
  type LineItem,
} from "@/lib/invoices-store";

export const Route = createFileRoute("/invoices/new")({
  head: () => ({
    meta: [
      { title: "New Invoice — Quick Typing" },
      { name: "description", content: "Create a new VAT invoice." },
    ],
  }),
  component: NewInvoice,
});

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function emptyItem(): LineItem {
  return { id: uid(), description: "", qty: 1, price: 0 };
}

function NewInvoice() {
  const navigate = useNavigate();
  useCompany(); // subscribe (for numbering freshness)
  const presets = usePresets();

  const [number] = useState(() => nextInvoiceNumber());
  const [issueDate, setIssueDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<Invoice["status"]>("paid");

  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientTrn, setClientTrn] = useState("");
  const [clientAddress, setClientAddress] = useState("");

  const [items, setItems] = useState<LineItem[]>([emptyItem()]);
  const [vatRate, setVatRate] = useState(() => getDefaultVat());
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("Thank you for your business.");

  function handleVatChange(v: number) {
    setVatRate(v);
    saveDefaultVat(v);
  }

  function handleAddService(name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Type a service name first");
      return;
    }
    addPreset(trimmed);
    toast.success(`"${trimmed}" added to services`);
  }

  const totals = useMemo(
    () => computeTotals({ items, vatRate, discount }),
    [items, vatRate, discount],
  );

  function updateItem(id: string, patch: Partial<LineItem>) {
    setItems((arr) => arr.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }
  function addItem() {
    setItems((arr) => [...arr, emptyItem()]);
  }
  function removeItem(id: string) {
    setItems((arr) => (arr.length > 1 ? arr.filter((i) => i.id !== id) : arr));
  }

  function handleSave(nextStatus: Invoice["status"]) {
    if (!clientName.trim()) {
      toast.error("Client name is required");
      return;
    }
    const cleanItems = items.filter(
      (i) => i.description.trim() && i.qty > 0,
    );
    if (cleanItems.length === 0) {
      toast.error("Add at least one line item");
      return;
    }
    const inv: Invoice = {
      id: uid(),
      number,
      issueDate,
      dueDate: dueDate || undefined,
      client: {
        name: clientName.trim(),
        phone: clientPhone.trim() || undefined,
        email: clientEmail.trim() || undefined,
        trn: clientTrn.trim() || undefined,
        address: clientAddress.trim() || undefined,
      },
      items: cleanItems,
      vatRate,
      discount,
      notes: notes.trim() || undefined,
      status: nextStatus,
      currency: "AED",
      createdAt: new Date().toISOString(),
    };
    saveInvoice(inv);
    bumpInvoiceNumber();
    toast.success(`Invoice ${inv.number} saved`);
    navigate({ to: "/invoices/$id", params: { id: inv.id } });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Invoice</h1>
          <p className="text-sm text-muted-foreground">
            Invoice number{" "}
            <span className="font-mono font-semibold">{number}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSave("draft")}>
            Save as Draft
          </Button>
          <Button onClick={() => handleSave(status === "draft" ? "sent" : status)}>
            Save & Preview
          </Button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Client Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Client Name *">
                <Input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ahmed Al Mansoori"
                />
              </Field>
              <Field label="Phone">
                <Input
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+971 50 000 0000"
                />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="client@example.com"
                />
              </Field>
              <Field label="TRN">
                <Input
                  value={clientTrn}
                  onChange={(e) => setClientTrn(e.target.value)}
                  placeholder="100XXXXXXXXXXXX"
                />
              </Field>
              <Field label="Address" className="sm:col-span-2">
                <Textarea
                  rows={2}
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="Street, Emirate, UAE"
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>Line Items</CardTitle>
              <Button size="sm" variant="outline" onClick={addItem}>
                + Add Item
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="hidden grid-cols-12 gap-2 text-xs font-medium text-muted-foreground md:grid">
                <div className="col-span-6">Description</div>
                <div className="col-span-2">Qty</div>
                <div className="col-span-3 text-right">Price (AED)</div>
                <div className="col-span-1" />
              </div>
              {items.map((it) => {
                const line = it.qty * it.price;
                return (
                  <div
                    key={it.id}
                    className="grid grid-cols-1 gap-2 rounded-lg border border-border/60 p-3 md:grid-cols-12 md:border-0 md:p-0"
                  >
                    <div className="md:col-span-6">
                      <Input
                        list="service-presets"
                        value={it.description}
                        onChange={(e) =>
                          updateItem(it.id, { description: e.target.value })
                        }
                        placeholder="Service description"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Input
                        type="number"
                        min={1}
                        value={it.qty}
                        onChange={(e) =>
                          updateItem(it.id, {
                            qty: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                      />
                    </div>
                    <div className="md:col-span-3">
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={it.price}
                        onChange={(e) =>
                          updateItem(it.id, {
                            price: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        className="text-right"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2 md:col-span-1 md:justify-end">
                      <span className="text-xs text-muted-foreground md:hidden">
                        {formatAED(line)}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Remove line"
                        onClick={() => removeItem(it.id)}
                        disabled={items.length === 1}
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                );
              })}
              <datalist id="service-presets">
                {presets.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Payment terms, thanks, etc."
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Issue Date">
                <Input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
              </Field>
              <Field label="Due Date">
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </Field>
              <Field label="Status">
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as Invoice["status"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="VAT %">
                  <Input
                    type="number"
                    min={0}
                    step="0.5"
                    value={vatRate}
                    onChange={(e) =>
                      handleVatChange(Number(e.target.value) || 0)
                    }
                  />
                </Field>
                <Field label="Discount (AED)">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  />
                </Field>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Subtotal" value={formatAED(totals.subtotal)} />
              {totals.discount > 0 && (
                <Row
                  label="Discount"
                  value={`− ${formatAED(totals.discount)}`}
                />
              )}
              <Row label={`VAT (${vatRate}%)`} value={formatAED(totals.vat)} />
              <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-3 text-base font-bold">
                <span>Total</span>
                <span className="text-primary">{formatAED(totals.total)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}