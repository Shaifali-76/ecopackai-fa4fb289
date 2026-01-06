import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ML_API_URL = "https://material-prediction-api.onrender.com/predict";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tensile_strength, weight_capacity, biodegradability_score, recyclability_percent } = await req.json();

    console.log("Calling ML API with:", { tensile_strength, weight_capacity, biodegradability_score, recyclability_percent });

    // Call the external ML API
    const response = await fetch(ML_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Tensile_Strength: tensile_strength,
        Weight_Capacity: weight_capacity,
        Biodegradability_Score: biodegradability_score,
        Recyclability_Percent: recyclability_percent,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ML API error:", response.status, errorText);
      throw new Error(`ML API returned ${response.status}: ${errorText}`);
    }

    const prediction = await response.json();
    console.log("ML API response:", prediction);

    // Map the response to our expected format
    const result = {
      material_name: prediction.Material_Name || prediction.material_name,
      co2_emission_score: prediction.CO2_Emission_Score || prediction.co2_emission_score,
      cost_score: prediction.Cost_Score || prediction.cost_score,
      sustainability_score: prediction.Sustainability_Score || prediction.sustainability_score,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Prediction error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Prediction failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
