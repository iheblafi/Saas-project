# ContentCraft AI - SaaS Platform

## 1. Overview

ContentCraft AI is a modern, scalable Software-as-a-Service (SaaS) application designed to help content creators and small businesses optimize their content and streamline their workflows. It leverages AI for content analysis, provides workflow automation features, enables team collaboration, and manages subscriptions through Stripe.

This application is built using Next.js (App Router), TypeScript, Tailwind CSS, Supabase (Auth & PostgreSQL Database), Stripe (Payments & Subscriptions), and OpenAI (AI Content Analysis).

## 2. Features

- **AI-Powered Content Optimization:** Analyze content (blog posts, articles) for SEO, readability, and engagement using OpenAI. Receive actionable suggestions for improvement.
- **Workflow Automation:** Create, edit, save, and manage content through various stages (Draft, In Review, Approved, Published, etc.). Includes status tracking.
- **Collaboration Tools:**
    - Collaborative Rich-Text Editor (using TipTap) with formatting options.
    - Content Commenting system.
    - Content Version History.
    - Basic Approval Workflow (status changes).
- **Subscription Management:**
    - User Authentication & Registration (Supabase Auth).
    - Free and Paid Subscription Tiers.
    - Stripe Integration for secure billing and payments.
    - Customer Portal (via Stripe) for managing subscriptions.
- **Modern UI/UX:**
    - Responsive design using Tailwind CSS.
    - Clean and intuitive interface.
    - Dark Mode support (basic implementation via Tailwind).
    - Accessible components (leveraging standard HTML and Tailwind).
- **Dashboard & Analytics:** User dashboard displaying content status summary using charts (Recharts).

## 3. Tech Stack

- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Basic Tailwind components (can be extended with Radix/Shadcn)
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Payments & Subscriptions:** Stripe
- **AI Analysis:** OpenAI API (GPT-4o or similar)
- **Rich-Text Editor:** TipTap
- **Charting:** Recharts
- **Validation:** Zod
- **Package Manager:** pnpm

## 4. Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v20.x or later recommended)
- [pnpm](https://pnpm.io/installation)
- [Git](https://git-scm.com/)
- [Stripe CLI](https://stripe.com/docs/stripe-cli) (Optional, for local webhook testing)

## 5. Getting Started / Setup

Follow these steps to set up the project locally:

1.  **Clone the Repository:**
    ```bash
    git clone <repository-url>
    cd saas-app
    ```

2.  **Install Dependencies:**
    ```bash
    pnpm install
    ```

3.  **Set up Supabase:**
    *   Go to [Supabase](https://supabase.com/) and create a new project.
    *   Navigate to **Project Settings > API**.
    *   Find your **Project URL** and **anon public API Key**. You will need these for the environment variables.
    *   Go to the **SQL Editor** in your Supabase dashboard.
    *   Copy the entire content of `supabase/schema.sql` and run it in the SQL Editor to create the necessary tables, functions, and policies.
    *   **Important:** Ensure Row Level Security (RLS) is enabled for all tables as defined in the schema.
    *   (Optional) Set up OAuth providers if needed under **Authentication > Providers**.

4.  **Set up Stripe:**
    *   Go to [Stripe](https://dashboard.stripe.com/register) and create an account.
    *   Find your **API Keys** (Secret Key) under **Developers > API Keys**. Use the **Test mode** keys for development.
    *   Create Products and Prices in your Stripe dashboard corresponding to your subscription plans (e.g., Free, Pro, Business). Note down the Price IDs (e.g., `price_...`).
    *   Set up a webhook endpoint:
        *   Go to **Developers > Webhooks**.
        *   Click **Add endpoint**.
        *   For local development, you'll use the Stripe CLI (see Section 8). For production, the Endpoint URL will be `YOUR_DEPLOYED_URL/api/webhooks/stripe`.
        *   Select the following events to listen for:
            *   `checkout.session.completed`
            *   `customer.subscription.created`
            *   `customer.subscription.updated`
            *   `customer.subscription.deleted`
            *   `invoice.paid`
            *   `invoice.payment_failed`
        *   After creating the endpoint, reveal the **Signing secret** (e.g., `whsec_...`). You will need this.

5.  **Set up OpenAI:**
    *   Go to [OpenAI](https://platform.openai.com/) and create an account.
    *   Navigate to **API Keys** and create a new secret key.

6.  **Configure Environment Variables:**
    *   Copy the example environment file:
        ```bash
        cp .env.example .env.local
        ```
    *   Open `.env.local` and fill in the values obtained from Supabase, Stripe, and OpenAI:
        ```env
        # Supabase Configuration
        NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_URL"
        NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"

        # Stripe Configuration
        STRIPE_SECRET_KEY="YOUR_STRIPE_SECRET_KEY" # Use sk_test_... for development
        STRIPE_WEBHOOK_SECRET="YOUR_STRIPE_WEBHOOK_SECRET" # Use whsec_... from Stripe CLI for local dev
        # Add your Stripe Price IDs if you plan to use them directly in code
        # STRIPE_FREE_PRICE_ID="price_..."
        # STRIPE_PRO_PRICE_ID="price_..."

        # OpenAI Configuration
        OPENAI_API_KEY="YOUR_OPENAI_API_KEY"

        # Other application settings (if any)
        # NEXT_PUBLIC_APP_URL="http://localhost:3000"
        ```

## 6. Running Locally

Once the setup is complete, start the development server:

```bash
pnpm dev
```

The application should now be running at [http://localhost:3000](http://localhost:3000).

## 7. Database Migrations

The initial database schema is defined in `supabase/schema.sql`. Apply this schema using the Supabase dashboard's SQL Editor as described in the setup steps.

For future schema changes:

*   **Using Supabase Studio:** Make changes directly in the Supabase dashboard.
*   **Using Supabase CLI:** (Recommended for complex projects) Set up the [Supabase CLI](https://supabase.com/docs/guides/cli) and use its migration tools (`supabase migration new <name>`, `supabase db push`).

Ensure your local schema definition (`supabase/schema.sql` or CLI migration files) stays in sync with your Supabase project.

## 8. Stripe Webhooks (Local Testing)

To test Stripe webhooks locally, use the Stripe CLI:

1.  **Log in to Stripe CLI:**
    ```bash
    stripe login
    ```

2.  **Forward webhook events to your local server:**
    ```bash
    stripe listen --forward-to localhost:3000/api/webhooks/stripe
    ```

3.  The CLI will output a webhook signing secret (e.g., `whsec_...`). **Use this specific secret** in your `.env.local` file for `STRIPE_WEBHOOK_SECRET` while testing locally.

4.  Trigger Stripe events (e.g., by completing a test checkout) and observe the logs in your running Next.js application and the Stripe CLI output.

**Remember to replace the webhook secret with the production one when deploying.**

## 9. Project Structure

```
saas-app/
├── public/             # Static assets
├── src/
│   ├── app/            # Next.js App Router (pages, layouts, API routes)
│   │   ├── api/        # API route handlers
│   │   ├── (auth)/     # Authentication related pages (login, signup)
│   │   ├── dashboard/  # User dashboard page
│   │   ├── layout.tsx  # Root layout
│   │   └── page.tsx    # Marketing homepage
│   ├── components/     # Reusable React components (e.g., TiptapEditor, charts)
│   ├── lib/            # Core libraries, utilities, helpers
│   │   ├── supabase/   # Supabase client/server/middleware setup
│   │   └── stripe/     # Stripe client/server setup
│   ├── styles/         # Global styles (globals.css)
│   ├── types/          # TypeScript type definitions (e.g., Supabase generated types)
│   └── middleware.ts   # Next.js middleware (for Supabase session handling)
├── supabase/
│   └── schema.sql    # Database schema definition
├── .env.example        # Example environment variables
├── .env.local          # Local environment variables (Gitignored)
├── next.config.mjs     # Next.js configuration
├── package.json
├── pnpm-lock.yaml
├── postcss.config.mjs  # PostCSS configuration (for Tailwind)
├── tailwind.config.ts  # Tailwind CSS configuration
└── tsconfig.json       # TypeScript configuration
```

## 10. Deployment

This application is configured for easy deployment to [Vercel](https://vercel.com/).

1.  **Push to GitHub/GitLab/Bitbucket:** Ensure your code is pushed to a Git repository.
2.  **Import Project on Vercel:**
    *   Log in to your Vercel account.
    *   Click **Add New... > Project**.
    *   Import the Git repository.
3.  **Configure Project Settings:**
    *   Vercel should automatically detect Next.js. No special build command or output directory settings are usually needed.
4.  **Configure Environment Variables:**
    *   Go to **Settings > Environment Variables** in your Vercel project.
    *   Add all the environment variables defined in `.env.example` (e.g., `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `STRIPE_SECRET_KEY`, `OPENAI_API_KEY`).
    *   **Crucially, add the production `STRIPE_WEBHOOK_SECRET` obtained from your Stripe dashboard's webhook configuration (NOT the one from Stripe CLI).**
5.  **Deploy:** Trigger a deployment (usually happens automatically on push to the main branch).
6.  **Update Stripe Webhook URL:** Ensure your Stripe webhook endpoint URL points to your Vercel production URL (`https://your-app-name.vercel.app/api/webhooks/stripe`).

**CI/CD:** Vercel's default integration with GitHub/GitLab/Bitbucket provides automatic CI/CD. Pushing to the configured branch (e.g., `main`) will trigger a new production deployment. Pushing to other branches can create preview deployments.

## 11. Scaling Considerations

- **Database:** Monitor Supabase database performance. Consider optimizing queries, adding indexes, or upgrading your Supabase plan if needed.
- **Serverless Functions:** Be mindful of Vercel's serverless function execution limits (time, memory). Optimize long-running API routes (like AI analysis).
- **AI API Costs:** OpenAI API usage incurs costs. Monitor usage and consider implementing rate limiting or usage quotas based on subscription plans.
- **Stripe API Limits:** Be aware of Stripe API rate limits, especially during high traffic.
- **Real-time Collaboration:** For enhanced real-time features (e.g., collaborative editing beyond basic TipTap), consider integrating Supabase Realtime or dedicated services like Liveblocks.
- **Background Jobs:** The current setup relies on user actions or webhooks. For true background/scheduled tasks (e.g., nightly reports, scheduled publishing independent of user sessions), consider external services like Vercel Cron Jobs, Supabase Edge Functions with schedules, or dedicated job queues.

