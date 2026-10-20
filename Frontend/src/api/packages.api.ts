import { api } from './client'
import type { CustomerPackage, PackageTemplate } from '@/types/package'

// Packages are created by the server after a verified payment (POST /payments/verify), never by the browser.
export const packagesApi = {
  async getTemplates(): Promise<PackageTemplate[]> {
    const { data } = await api.get<{ templates: PackageTemplate[] }>('/packages/templates')
    return data.templates
  },
  async getMine(): Promise<CustomerPackage[]> {
    const { data } = await api.get<{ packages: CustomerPackage[] }>('/packages/mine')
    return data.packages
  },
}