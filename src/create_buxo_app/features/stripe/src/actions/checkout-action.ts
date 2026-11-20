'use server';

import { redirect } from 'next/navigation';
import { getStripe, isProductKey, PRODUCTS } from '@/lib/server/stripe';
import { absoluteUrl } from '@/lib/site';

// Sends the visitor to Stripe Checkout for one of PRODUCTS. Use it as a form action:
//
//   <form action={checkoutAction}>
//     <input type="hidden" name="product" value="example" />
//     <Button type="submit">Buy</Button>
//   </form>
export async function checkoutAction(formData: FormData): Promise<void> {
  const product = formData.get('product');
  if (!isProductKey(product)) throw new Error('Unknown product');
  const { price, mode } = PRODUCTS[product];
  if (!price) throw new Error(`No Stripe price is configured for "${product}"`);

  const session = await getStripe().checkout.sessions.create({
    mode,
    line_items: [{ price, quantity: 1 }],
    // TODO: point these at real pages (see TODO.md)
    success_url: absoluteUrl('/?checkout=success'),
    cancel_url: absoluteUrl('/?checkout=cancelled'),
  });
  if (!session.url) throw new Error('Stripe did not return a checkout URL');

  redirect(session.url);
}
