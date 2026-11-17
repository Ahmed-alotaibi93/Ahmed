import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Airport, Direction, Quote, QuoteOption } from "@/api/types";

export interface BookingDraft {
  direction: Direction;
  airport: Airport | null;
  location: { label: string; lat: number; lng: number } | null;
  addressDetails: string;
  pickupAt: Date | null;
  flightNumber: string;
  passengers: number;
  bags: number;
  quote: Quote | null;
  option: QuoteOption | null;
}

const initial: BookingDraft = {
  direction: "TO_AIRPORT",
  airport: null,
  location: null,
  addressDetails: "",
  pickupAt: null,
  flightNumber: "",
  passengers: 1,
  bags: 1,
  quote: null,
  option: null,
};

interface DraftValue {
  draft: BookingDraft;
  update: (patch: Partial<BookingDraft>) => void;
  reset: () => void;
}

const DraftContext = createContext<DraftValue | null>(null);

export function DraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<BookingDraft>(initial);
  const value = useMemo<DraftValue>(
    () => ({
      draft,
      update: (patch) => setDraft((d) => ({ ...d, ...patch })),
      reset: () => setDraft(initial),
    }),
    [draft],
  );
  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}

export function useDraft() {
  const v = useContext(DraftContext);
  if (!v) throw new Error("useDraft outside provider");
  return v;
}
