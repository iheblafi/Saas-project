import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import Stripe from "stripe";
import { Database } from "@/types/supabase"; // Assuming you have generated types from your Supabase schema

type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
type Customer = Database["public"]["Tables"]["customers"]["Row"];

// Note: Ensure RLS policies allow these server-side operations.

// Updates or inserts customer data in Supabase
export const updateCustomerRecord = async (userId: string, stripeCustomerId: string) => {
  const supabase = createClient();
  const { error } = await supabase
    .from("customers")
    .upsert({ id: userId, stripe_customer_id: stripeCustomerId });

  if (error) {
    console.error("Error updating customer record:", error);
    throw error;
  }
  console.log(`Customer record updated/inserted for user: ${userId}`);
};

// Updates or inserts subscription data in Supabase
export const upsertSubscriptionRecord = async (subscription: Stripe.Subscription) => {
  const supabase = createClient();

  const subscriptionData: Partial<Subscription> = {
    id: subscription.id,
    user_id: subscription.metadata.supabaseUserId, // Ensure this metadata is set during checkout
    metadata: subscription.metadata,
    status: subscription.status,
    price_id: subscription.items.data[0].price.id,
    quantity: subscription.items.data[0].quantity,
    cancel_at_period_end: subscription.cancel_at_period_end,
    created: new Date(subscription.created * 1000).toISOString(),
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
    cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
    canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
    trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
    trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
  };

  const { error } = await supabase.from("subscriptions").upsert(subscriptionData);

  if (error) {
    console.error("Error upserting subscription record:", error);
    throw error;
  }
  console.log(`Subscription record upserted: ${subscription.id}`);
};

// Retrieves the Stripe customer ID for a user from Supabase
export const getStripeCustomerId = async (userId: string): Promise<string | null> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();

  if (error && error.code !== "PGRST116") { // PGRST116: row not found
    console.error("Error fetching Stripe customer ID:", error);
    return null;
  }

  return data?.stripe_customer_id || null;
};

// Creates a Stripe Portal session for managing subscriptions
export const createStripePortalSession = async (userId: string, returnUrl: string) => {
  const supabase = createClient();
  const { data: profile } = await supabase.auth.getUser();

  if (!profile.user) {
    throw new Error("User not found");
  }

  let customerId = await getStripeCustomerId(userId);

  if (!customerId) {
    // This case should ideally not happen if customer is created on signup/first payment
    // But as a fallback, create the customer now
    const customer = await stripe.customers.create({
      email: profile.user.email,
      metadata: { supabaseUserId: userId },
    });
    customerId = customer.id;
    await updateCustomerRecord(userId, customerId);
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return portalSession.url;
};

