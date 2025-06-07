import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20", // Use the latest API version
  typescript: true,
});

// Helper function to retrieve or create a Stripe customer linked to a Supabase user
export const getOrCreateStripeCustomer = async ({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) => {
  // TODO: Implement logic to check Supabase `customers` table first
  // If customer exists, return stripe_customer_id
  // If not, create a new Stripe customer and store the mapping in Supabase

  // Placeholder implementation:
  const existingCustomer = null; // Replace with Supabase query

  if (existingCustomer) {
    return existingCustomer.stripe_customer_id;
  }

  const customer = await stripe.customers.create({
    email: email,
    metadata: {
      supabaseUserId: userId,
    },
  });

  // TODO: Insert into Supabase `customers` table: { id: userId, stripe_customer_id: customer.id }

  return customer.id;
};

