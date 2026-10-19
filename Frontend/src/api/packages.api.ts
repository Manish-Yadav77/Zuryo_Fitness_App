import { api } from './client';
import type { CustomerPackage, PackageTemplate } from '@/types/package';

export const packagesApi = {
  async getTemplates(): Promise<PackageTemplate[]> {
    const { data } = await api.get<{ templates: PackageTemplate[] }>('/packages/templates');
    return data.templates;
  },
  async getMine(): Promise<CustomerPackage[]> {
    const { data } = await api.get<{ packages: CustomerPackage[] }>('/packages/mine');
    return data.packages;
  },
  async purchase(templateId: string, paymentId?: string): Promise<CustomerPackage> {
    const { data } = await api.post<{ package: CustomerPackage }>('/packages/purchase', {
      templateId,
      paymentId,
    });
    return data.package;
  },
};