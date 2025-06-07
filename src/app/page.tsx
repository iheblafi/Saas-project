"/use client"; // Mark as client component if using hooks like useState, or for interactivity

import React from "react";
import Link from "next/link";

// Example Pricing Tiers Data (replace with actual plan details)
const pricingTiers = [
  {
    name: "Free",
    price: "$0",
    frequency: "/ month",
    description: "Get started with basic content analysis.",
    features: [
      "Basic SEO suggestions",
      "Readability analysis (limited)",
      "1 User",
      "Community support",
    ],
    cta: "Sign up for free",
    href: "/signup", // Link to your signup page
  },
  {
    name: "Pro",
    price: "$29",
    frequency: "/ month",
    description: "For individual creators and small teams.",
    features: [
      "Advanced SEO & Engagement analysis",
      "Full Readability analysis",
      "Content scheduling (manual)",
      "Collaboration tools (up to 5 users)",
      "Priority email support",
    ],
    cta: "Get started with Pro",
    href: "/signup?plan=pro", // Link to signup with plan pre-selected
    popular: true,
  },
  {
    name: "Business",
    price: "$99",
    frequency: "/ month",
    description: "For growing businesses and agencies.",
    features: [
      "All Pro features",
      "Advanced workflow automation",
      "Team roles & permissions",
      "Unlimited users",
      "Dedicated account manager",
      "API Access (coming soon)",
    ],
    cta: "Contact Sales",
    href: "/contact", // Link to contact page or signup
  },
];

const MarketingHomepage = () => {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen">
      {/* Header/Nav (Simplified) */}
      <header className="p-4 flex justify-between items-center shadow-sm">
        <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">ContentCraft AI</h1>
        <div>
          <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline mr-4">Login</Link>
          <Link href="/signup" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Sign Up
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="text-center py-20 px-4 bg-gradient-to-b from-white dark:from-gray-800 to-gray-100 dark:to-gray-900">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-4">Optimize Your Content, Effortlessly</h2>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          Leverage AI to enhance your content for SEO, readability, and engagement. Streamline your workflow and collaborate seamlessly with your team.
        </p>
        <Link href="/signup" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition duration-300">
          Get Started Now
        </Link>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-4">
        <h3 className="text-3xl font-bold text-center mb-12">Why Choose ContentCraft AI?</h3>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Feature 1 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
            {/* Icon Placeholder */}
            <div className="text-4xl mb-4">🚀</div>
            <h4 className="text-xl font-semibold mb-2">AI-Powered Optimization</h4>
            <p className="text-gray-600 dark:text-gray-300">Get actionable insights on SEO, readability, and engagement to make your content shine.</p>
          </div>
          {/* Feature 2 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
            {/* Icon Placeholder */}
            <div className="text-4xl mb-4">🔄</div>
            <h4 className="text-xl font-semibold mb-2">Streamlined Workflows</h4>
            <p className="text-gray-600 dark:text-gray-300">Manage content from draft to publication with status tracking and automated reminders.</p>
          </div>
          {/* Feature 3 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
            {/* Icon Placeholder */}
            <div className="text-4xl mb-4">👥</div>
            <h4 className="text-xl font-semibold mb-2">Seamless Collaboration</h4>
            <p className="text-gray-600 dark:text-gray-300">Work together with a rich-text editor, comments, version control, and approval flows.</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 px-4 bg-gray-100 dark:bg-gray-800">
        <h3 className="text-3xl font-bold text-center mb-12">Simple, Transparent Pricing</h3>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`bg-white dark:bg-gray-700 rounded-lg shadow-lg p-8 flex flex-col ${tier.popular ? "border-2 border-blue-500" : ""}`}
            >
              {tier.popular && (
                <div className="text-center mb-4">
                  <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase">Most Popular</span>
                </div>
              )}
              <h4 className="text-2xl font-semibold text-center mb-2">{tier.name}</h4>
              <p className="text-center text-gray-500 dark:text-gray-400 mb-4">{tier.description}</p>
              <p className="text-center text-4xl font-bold mb-1">{tier.price}<span className="text-lg font-normal text-gray-500 dark:text-gray-400">{tier.frequency}</span></p>
              <ul className="mt-6 mb-8 space-y-2 flex-grow">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7"></path></svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href={tier.href} className={`block w-full text-center py-3 px-6 rounded-lg font-semibold transition duration-300 ${tier.popular ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-500"}`}>
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>&copy; {new Date().getFullYear()} ContentCraft AI. All rights reserved.</p>
        {/* Add links to privacy policy, terms of service, etc. */}
      </footer>
    </div>
  );
};

export default MarketingHomepage;

