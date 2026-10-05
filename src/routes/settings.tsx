import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getCompany,
  saveCompany,
  type CompanySettings,
} from "@/lib/invoices-store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Quick Documents Clearing" },
      { name: "description", content: "Manage Quick Documents Clearing invoice details." },
      { property: "og:title", content: "Settings — Quick Documents Clearing" },
      { property: "og:description", content: "Manage Quick Documents Clearing invoice details." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [c, setC] = useState<CompanySettings | null>(null);

  useEffect(() => {
    setC(getCompany());
  }, []);

  if (!c) return null;

  function set<K extends keyof CompanySettings>(k: K, v: CompanySettings[K]) {
    setC((prev) => (prev ? { ...prev, [k]: v } : prev));
  }

  function handleSave() {
    if (!c) return;
    saveCompany(c);
    toast.success("Company settings saved");
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Company Settings</h1>
        <p className="text-sm text-muted-foreground">
          These details appear on every invoice you create.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Business Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Company Name">
              <Input value={c.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Arabic Name">
              <Input
                dir="rtl"
                value={c.arabicName}
                onChange={(e) => set("arabicName", e.target.value)}
              />
            </Field>
            <Field label="Tagline">
              <Input
                value={c.tagline}
                onChange={(e) => set("tagline", e.target.value)}
              />
            </Field>
            <Field label="Phone">
              <Input value={c.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label="Email">
              <Input value={c.email} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <Field label="Website">
              <Input
                value={c.website}
                onChange={(e) => set("website", e.target.value)}
              />
            </Field>
            <Field label="Address">
              <Textarea
                rows={2}
                value={c.address}
                onChange={(e) => set("address", e.target.value)}
              />
            </Field>
            <Field label="TRN (Tax Registration Number)">
              <Input value={c.trn} onChange={(e) => set("trn", e.target.value)} />
            </Field>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Numbering</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Field label="Prefix">
                <Input
                  value={c.invoicePrefix}
                  onChange={(e) => set("invoicePrefix", e.target.value)}
                />
              </Field>
              <Field label="Next Number">
                <Input
                  type="number"
                  value={c.nextInvoiceNumber}
                  onChange={(e) =>
                    set("nextInvoiceNumber", Number(e.target.value) || 1)
                  }
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Details (optional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Bank Name">
                <Input
                  value={c.bankName}
                  onChange={(e) => set("bankName", e.target.value)}
                />
              </Field>
              <Field label="Account Number">
                <Input
                  value={c.bankAccount}
                  onChange={(e) => set("bankAccount", e.target.value)}
                />
              </Field>
              <Field label="IBAN">
                <Input value={c.iban} onChange={(e) => set("iban", e.target.value)} />
              </Field>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button size="lg" onClick={handleSave}>
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}