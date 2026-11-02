"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_DATA_MODE, getApi, type DataMode } from "./api";

const DataSourceContext = createContext(DEFAULT_DATA_MODE);

export function DataSourceProvider({ mode, children }: { mode: DataMode; children: ReactNode }) {
  return <DataSourceContext.Provider value={mode}>{children}</DataSourceContext.Provider>;
}

export function useDataSource() {
  const mode = useContext(DataSourceContext);
  return { mode, api: getApi(mode), isDemo: mode === "demo" };
}
