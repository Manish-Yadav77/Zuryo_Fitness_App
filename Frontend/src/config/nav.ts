import { ClipboardList, LayoutDashboard, ReceiptCent as ReceiptPercent } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Role } from '@/types/auth';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

export const roleHome: Record<Role, string> = {
  customer: '/customer',
  trainer: '/trainer',
  admin: '/admin',
};

export const navByRole: Record<Role, NavItem[]> = {
  customer: [
    { label: 'Dashboard', to: '/customer', icon: LayoutDashboard },
    { label: 'Fitness Profile', to: '/customer/assessment', icon: ClipboardList },
  ],
  trainer: [{ label: 'Dashboard', to: '/trainer', icon: LayoutDashboard }],
  admin: [
    { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
    { label: 'Pricing Rules', to: '/admin/pricing', icon: ReceiptPercent },
  ],
};

export const roleLabel: Record<Role, string> = {
  customer: 'Customer',
  trainer: 'Trainer',
  admin: 'Admin',
};