import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server"; // Use server client for DB operations
import { updateCustomerRecord, upsertSubscriptionRecord } from "@/lib/stripe/server";

const relevantEvents = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
]);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabase = createClient(); // Keep Supabase client initialization if needed for direct DB access, though helpers encapsulate it.

  let event: Stripe.Event;

  try {
    if (!sig || !webhookSecret) {
      console.error("Stripe webhook secret or signature missing.");
      return new NextResponse("Webhook secret not configured", { status: 400 });
    }
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Error verifying webhook signature: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (relevantEvents.has(event.type)) {
    try {
      switch (event.type) {
        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted":
          const subscription = event.data.object as Stripe.Subscription;
          // Ensure metadata contains the user ID
          if (!subscription.metadata.supabaseUserId) {
            console.error(`Missing supabaseUserId in subscription metadata: ${subscription.id}`);
            // Potentially fetch customer and find user ID if needed, but ideally it should be set
          } else {
             await upsertSubscriptionRecord(subscription);
             console.log(`Handled subscription event: ${event.type}`, subscription.id);
          }
          break;
        case "invoice.paid":
          const invoice = event.data.object as Stripe.Invoice;
          // If subscription exists, update status (e.g., if it was past_due)
          if (invoice.subscription) {
            const subscriptionId = invoice.subscription as string;
            // Fetch the subscription to ensure we have the latest data and user ID
            const updatedSubscription = await stripe.subscriptions.retrieve(subscriptionId);
            await upsertSubscriptionRecord(updatedSubscription); // Upsert to update status and periods
            console.log(`Handled invoice paid for subscription: ${subscriptionId}`);
          }
          break;
        case "invoice.payment_failed":
          const failedInvoice = event.data.object as Stripe.Invoice;
          // If subscription exists, update status (e.g., to past_due or unpaid)
          if (failedInvoice.subscription) {
            const subscriptionId = failedInvoice.subscription as string;
            // Fetch the subscription to ensure we have the latest data and user ID
            const updatedSubscription = await stripe.subscriptions.retrieve(subscriptionId);
            await upsertSubscriptionRecord(updatedSubscription); // Upsert to update status
            console.log(`Handling invoice payment failed for subscription: ${subscriptionId}`);
          }
          break;
        case "checkout.session.completed":
          const checkoutSession = event.data.object as Stripe.Checkout.Session;
          // Handle customer creation/update
          if (checkoutSession.customer && checkoutSession.client_reference_id) {
             const customerId = checkoutSession.customer as string;
             const userId = checkoutSession.client_reference_id; // Should be the Supabase user ID passed during checkout creation
             await updateCustomerRecord(userId, customerId);
             console.log(`Updated customer record for user: ${userId} with Stripe customer: ${customerId}`);
          }
          // Handle subscription creation via checkout
          if (checkoutSession.mode === "subscription") {
            const subscriptionId = checkoutSession.subscription;
            if (subscriptionId) {
                const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
                // Ensure metadata includes user ID before upserting
                if (!subscription.metadata.supabaseUserId && checkoutSession.client_reference_id) {
                    subscription.metadata.supabaseUserId = checkoutSession.client_reference_id;
                }
                if (subscription.metadata.supabaseUserId) {
                    await upsertSubscriptionRecord(subscription);
                    console.log(`Handled checkout session completed for subscription: ${subscriptionId}`);
                } else {
                    console.error(`Missing supabaseUserId in subscription metadata after checkout: ${subscriptionId}`);
                }
            } else {
                 console.error(`Checkout session completed but no subscription ID found: ${checkoutSession.id}`);
            }
          }
          break;
        default:
          console.warn(`Unhandled relevant event type: ${event.type}`);
      }
    } catch (error) {
      console.error("Error handling webhook event:", error);
      // It's crucial not to return 4xx errors for webhook issues that aren't signature verification
      // Returning 5xx allows Stripe to retry.
      return new NextResponse(
        `Webhook handler failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}

