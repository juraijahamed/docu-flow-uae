import { useSyncExternalStore } from "react";

export interface LineItem {
  id: string;
  description: string;
  qty: number;
  price: number;
}

export interface Client {
  name: string;
  phone?: string;
  email?: string;
  trn?: string;
  address?: string;
}

export interface Invoice {
  id: string;
  number: string;
  issueDate: string; // ISO date
  dueDate?: string;
  client: Client;
  items: LineItem[];
  vatRate: number; // e.g. 5 for 5%
  discount: number; // absolute AED
  notes?: string;
  status: "draft" | "sent" | "paid";
  currency: string; // "AED"
  createdAt: string;
}

export interface CompanySettings {
  name: string;
  arabicName: string;
  tagline: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  trn: string;
  bankName: string;
  bankAccount: string;
  iban: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
}

const INV_KEY = "qt.invoices.v1";
const CO_KEY = "qt.company.v1";
const PRESETS_KEY = "qt.presets.v1";
const VAT_KEY = "qt.vat.v1";

export const defaultCompany: CompanySettings = {
  name: "Quick Typing",
  arabicName: "كويك لتخليص المعاملات",
  tagline: "Document Clearing & Typing Services",
  phone: "+971 6 5299746, +971 58 8308804",
  email: "quicktypinguaq@gmail.com",
  website: "quicktypinguaq.ae",
  address: "Al huboob 2, Al salama, Umm Al Quwain, UAE",
  trn: "",
  bankName: "",
  bankAccount: "",
  iban: "",
  invoicePrefix: "QT",
  nextInvoiceNumber: 1001,
};

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
  emit();
}

export function getInvoices(): Invoice[] {
  return read<Invoice[]>(INV_KEY, []);
}
export function getInvoice(id: string): Invoice | undefined {
  return getInvoices().find((i) => i.id === id);
}
export function saveInvoice(inv: Invoice) {
  const all = getInvoices();
  const idx = all.findIndex((i) => i.id === inv.id);
  if (idx >= 0) all[idx] = inv;
  else all.unshift(inv);
  write(INV_KEY, all);
}
export function deleteInvoice(id: string) {
  write(
    INV_KEY,
    getInvoices().filter((i) => i.id !== id),
  );
}

export function getCompany(): CompanySettings {
  return { ...defaultCompany, ...read<Partial<CompanySettings>>(CO_KEY, {}) };
}
export function saveCompany(c: CompanySettings) {
  write(CO_KEY, c);
}

export function nextInvoiceNumber(): string {
  const c = getCompany();
  const n = c.nextInvoiceNumber;
  return `${c.invoicePrefix}-${String(n).padStart(5, "0")}`;
}
export function bumpInvoiceNumber() {
  const c = getCompany();
  saveCompany({ ...c, nextInvoiceNumber: c.nextInvoiceNumber + 1 });
}

let invSnapshot: { raw: string; parsed: Invoice[] } = { raw: "[]", parsed: [] };
export function useInvoiceList(): Invoice[] {
  return useSyncExternalStore(
    subscribe,
    () => {
      const raw = (typeof window !== "undefined" && window.localStorage.getItem(INV_KEY)) || "[]";
      if (raw !== invSnapshot.raw) {
        try {
          invSnapshot = { raw, parsed: JSON.parse(raw) as Invoice[] };
        } catch {
          invSnapshot = { raw, parsed: [] };
        }
      }
      return invSnapshot.parsed;
    },
    () => invSnapshot.parsed,
  );
}

let coSnapshot: { raw: string; parsed: CompanySettings } = {
  raw: "",
  parsed: defaultCompany,
};
export function useCompany(): CompanySettings {
  return useSyncExternalStore(
    subscribe,
    () => {
      const raw = (typeof window !== "undefined" && window.localStorage.getItem(CO_KEY)) || "";
      if (raw !== coSnapshot.raw) {
        try {
          coSnapshot = {
            raw,
            parsed: { ...defaultCompany, ...(raw ? (JSON.parse(raw) as Partial<CompanySettings>) : {}) },
          };
        } catch {
          coSnapshot = { raw, parsed: defaultCompany };
        }
      }
      return coSnapshot.parsed;
    },
    () => coSnapshot.parsed,
  );
}

export function computeTotals(inv: Pick<Invoice, "items" | "vatRate" | "discount">) {
  const subtotal = inv.items.reduce((s, i) => s + i.qty * i.price, 0);
  const afterDiscount = Math.max(0, subtotal - (inv.discount || 0));
  const vat = +(afterDiscount * (inv.vatRate / 100)).toFixed(2);
  const total = +(afterDiscount + vat).toFixed(2);
  return { subtotal: +subtotal.toFixed(2), discount: inv.discount || 0, vat, total };
}

export function formatAED(n: number) {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    minimumFractionDigits: 2,
  }).format(n);
}

export const SERVICE_PRESETS = [
  "PRO Services",
  "Medical Typing",
  "Emirates ID Application",
  "Visa Service",
  "Documents Clearing",
  "Labour Contract",
  "Immigration Services",
  "Tourist / Visit Visa",
  "Dubai Visa Typing (Company)",
  "Mulkia Service",
  "Legal Transaction",
  "Vehicle Fine Services",
  "Vehicle License Services",
  "Driving License Renewal",
  "FEWA Online Services",
  "Civil Defense Services",
  "Sponsorship Agreement",
  "Arabic / English Typing",
  "Memorandum Agreement Typing",
];

let presetsSnapshot: { raw: string; parsed: string[] } = {
  raw: "",
  parsed: SERVICE_PRESETS,
};
export function getPresets(): string[] {
  return read<string[]>(PRESETS_KEY, SERVICE_PRESETS);
}
export function addPreset(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return;
  const all = getPresets();
  if (all.some((p) => p.toLowerCase() === trimmed.toLowerCase())) return;
  write(PRESETS_KEY, [...all, trimmed]);
}
export function removePreset(name: string) {
  write(
    PRESETS_KEY,
    getPresets().filter((p) => p !== name),
  );
}
export function usePresets(): string[] {
  return useSyncExternalStore(
    subscribe,
    () => {
      const raw =
        (typeof window !== "undefined" &&
          window.localStorage.getItem(PRESETS_KEY)) ||
        "";
      if (raw !== presetsSnapshot.raw) {
        try {
          presetsSnapshot = {
            raw,
            parsed: raw
              ? (JSON.parse(raw) as string[])
              : SERVICE_PRESETS,
          };
        } catch {
          presetsSnapshot = { raw, parsed: SERVICE_PRESETS };
        }
      }
      return presetsSnapshot.parsed;
    },
    () => presetsSnapshot.parsed,
  );
}

export function getDefaultVat(): number {
  return read<number>(VAT_KEY, 5);
}
export function saveDefaultVat(rate: number) {
  write(VAT_KEY, rate);
}