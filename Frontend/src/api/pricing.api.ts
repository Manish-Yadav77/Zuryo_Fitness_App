import { api } from './client';
import type { PriceQuote, PricingConfig } from '@/types/pricing';

export const pricingApi = {
  async getConfig(): Promise<PricingConfig> {
    const { data } = await api.get<{ config: PricingConfig }>('/pricing/config');
    return data.config;
  },
  async getQuote(startAtIso: string): Promise<PriceQuote> {
    const { data } = await api.post<{ quote: PriceQuote }>('/pricing/quote', { startAt: startAtIso });
    return data.quote;
  },
};