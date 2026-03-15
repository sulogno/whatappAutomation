"use client";

import { createContext, useContext } from "react";
import type { Business, BusinessSegmentConfig, TerminologyMap } from "@/types";

export interface DashboardContextValue {
  business: Business | null;
  segmentConfig: BusinessSegmentConfig | null;
  terminology: TerminologyMap;
}

export const DashboardContext = createContext<DashboardContextValue>({
  business: null,
  segmentConfig: null,
  terminology: {
    customer: "Customer",
    order: "Order",
    menu: "Menu",
    booking: "Booking",
    appointment: "Appointment",
    patient: "Patient",
    client: "Client",
    student: "Student",
    service: "Service",
    slot: "Slot",
    invoice: "Invoice",
    product: "Product",
    item: "Item",
  },
});

export function useDashboardContext() {
  return useContext(DashboardContext);
}
