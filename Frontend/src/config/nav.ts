import { Calendar, CalendarClock, ClipboardList, LayoutDashboard, PlusCircle, ReceiptCent as ReceiptPercent, Wallet } from 'lucide-react';
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
    { label: 'Book Session', to: '/customer/book', icon: PlusCircle },
    { label: 'My Bookings', to: '/customer/bookings', icon: Calendar },
    { label: 'Packages', to: '/customer/packages', icon: Wallet },
    { label: 'Fitness Profile', to: '/customer/assessment', icon: ClipboardList },
  ],
  trainer: [
    { label: 'Dashboard', to: '/trainer', icon: LayoutDashboard },
    { label: 'My Availability', to: '/trainer/availability', icon: CalendarClock },
  ],
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