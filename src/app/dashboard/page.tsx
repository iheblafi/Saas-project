"/use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client"; // Use client component Supabase client
// import ContentStatusChart from "@/components/charts/ContentStatusChart"; // Import chart component later
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'; // Example import

// Placeholder data structure - replace with actual fetched data
interface ContentSummary {
  status: string;
  count: number;
}

const DashboardPage = () => {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [contentSummary, setContentSummary] = useState<ContentSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);

      // Fetch content counts by status (example)
      const { data, error: fetchError } = await supabase
        .from("content")
        .select("status, count", { count: "exact" })
        // .eq("user_id", userId) // RLS should handle this, but explicit check might be needed depending on policy
        .group("status");

      if (fetchError) {
        console.error("Error fetching dashboard data:", fetchError);
        setError("Failed to load dashboard data.");
        setContentSummary([]); // Clear data on error
      } else if (data) {
        // Transform data for the chart
        const summary = data.map(item => ({ status: item.status || 'Unknown', count: item.count || 0 }));
        setContentSummary(summary);
      } else {
        setContentSummary([]); // Set empty if no data
      }

      setLoading(false);
    };

    fetchDashboardData();
  }, [supabase]);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {loading && <p>Loading dashboard data...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card for Content Status Summary */}
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Content Status Summary</h2>
            {contentSummary.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={contentSummary}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p>No content data available to display.</p>
            )}
          </div>

          {/* Add more cards/charts here for other analytics */}
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
             <h2 className="text-xl font-semibold mb-4">Other Analytics (Placeholder)</h2>
             <p>More charts and data visualizations will go here.</p>
             {/* Example: Placeholder for SEO Score Distribution */}
             {/* Example: Placeholder for Readability Trends */}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;

