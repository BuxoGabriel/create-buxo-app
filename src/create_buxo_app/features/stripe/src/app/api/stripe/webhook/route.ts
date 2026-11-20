import type Stripe from 'stripe';
import { getStripe } from '@/lib/server/stripe';

// Stripe calls this after a payment. The redirect back to the site can be skipped or faked, so this
// is the only place to trust that money moved: fulfil orders here, not on the success page.
export async function POST(request: Request): Promise<Response> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return new Response('Webhook is not configured', { status: 500 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) return new Response('Missing signature', { status: 400 });

  let event: Stripe.Event;
  try {
    // The signature covers the exact bytes Stripe sent, so read the raw body, not request.json()
    event = getStripe().webhooks.constructEvent(await request.text(), signature, webhookSecret);
  } catch (error) {
    console.error('Stripe webhook signature check failed', error);
    return new Response('Invalid signature', { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      // TODO: fulfil the order. Stripe retries and can send an event twice, so key your writes on
      // session.id and make them safe to repeat.
      console.log(`Checkout completed: ${session.id}`);
      break;
    }
    default:
      break;
  }

  return Response.json({ received: true });
}
