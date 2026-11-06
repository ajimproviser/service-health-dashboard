import { createContext, useContext } from 'react'
import type {
  Administration,
  ChartType,
  SeriesPoint,
  ServiceDetails,
  ServiceSummary,
} from '../types'

/**
 * The only thing the UI knows about the backend. The bundled mock implements it for local use;
 * a real REST client can implement the same interface without touching any component.
 */
export interface ApiClient {
  listServices(signal?: AbortSignal): Promise<ServiceSummary[]>
  getServiceDetails(name: string, rangeMinutes: number, signal?: AbortSignal): Promise<ServiceDetails>
  getSeries(
    name: string,
    path: string,
    chart: ChartType,
    rangeMinutes: number,
    signal?: AbortSignal,
  ): Promise<SeriesPoint[]>
  setServiceEnabled(name: string, enabled: boolean): Promise<Administration>
}

export const ApiContext = createContext<ApiClient | null>(null)

export function useApi(): ApiClient {
  const api = useContext(ApiContext)
  if (!api) throw new Error('useApi must be used inside an <ApiContext.Provider>')
  return api
}
