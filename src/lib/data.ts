
import type { Product, Customer, Order, Seller, Cashier } from './types';

export const products: Product[] = [];

export const customers: Customer[] = [
    {
    id: 'cust-005',
    name: 'Cliente Mostrador',
    email: 'mostrador@example.com',
    phone: '000000000',
    avatarUrl: 'https://placehold.co/100x100.png',
    lastOrderDate: '',
    totalSpent: 0,
  },
];

export const orders: Order[] = [];

export const sellers: Seller[] = [];

export const cashiers: Cashier[] = [];
