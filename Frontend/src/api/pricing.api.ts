import { api } from './client';
import type { PricingConfig, PriceQuote } from '@/types/pricing';

export const pricingApi = {
  async getConfig(): Promise<PricingConfig> {
    const { data } = await api.get<{ config: PricingConfig }>('/pricing/config');
    return data.config;
  },
  async updateConfig(payload: {
    normalPaise: number;
    peakPaise: number;
    commissionPercent: number;
    peakWindows: PricingConfig['peakWindows'];
  }): Promise<PricingConfig> {
    const { data } = await api.put<{ config: PricingConfig }>('/pricing/config', payload);
    return data.config;
  },
  async getQuote(dateIso?: string): Promise<PriceQuote> {
    const query = dateIso ? `?date=${encodeURIComponent(dateIso)}` : '';
    const { data } = await api.get<{ quote: PriceQuote }>(`/pricing/quote${query}`);
    return data.quote;
  },
};
