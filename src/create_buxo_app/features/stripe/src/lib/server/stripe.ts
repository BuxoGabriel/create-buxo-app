import 'server-only';
import Stripe from 'stripe';

// What can be bought. Checkout only accepts a key of this object, never a price id sent by the
// browser, so a visitor can't check out with a price you didn't list.
export const PRODUCTS = {
  example: { price: process.env.STRIPE_PRICE_EXAMPLE, mode: 'payment' },
} satisfies Record<string, { price: string | undefined; mode: 'payment' | 'subscription' }>;

export type ProductKey = keyof typeof PRODUCTS;

export function isProductKey(value: unknown): value is ProductKey {
  return typeof value === 'string' && Object.hasOwn(PRODUCTS, value);
}

let client: Stripe | undefined;

// Created on first use, so the site builds and runs without Stripe keys until a payment is made.
export function getStripe(): Stripe {
  if (!client) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) throw new Error('STRIPE_SECRET_KEY is not set');
    client = new Stripe(secretKey);
  }
  return client;
}
