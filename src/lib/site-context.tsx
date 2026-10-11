"use client";

import { createContext, useContext } from "react";
import { DEFAULT_SITE, type SiteData } from "./site";

const SiteContext = createContext<SiteData>(DEFAULT_SITE);

export function SiteProvider({ site, children }: { site: SiteData; children: React.ReactNode }) {
  return <SiteContext.Provider value={site}>{children}</SiteContext.Provider>;
}

export const useSite = () => useContext(SiteContext);
