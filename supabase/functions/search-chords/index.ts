import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, query, url } = await req.json();

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      throw new Error("FIRECRAWL_API_KEY is not configured");
    }

    // ── ACTION: search ──
    if (action === "search") {
      if (!query || typeof query !== "string" || !query.trim()) {
        return new Response(JSON.stringify({ error: "A song name is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const searchQuery = `${query.trim()} chords site:ultimate-guitar.com OR site:cifraclub.com.br`;
      console.log("Firecrawl search:", searchQuery);

      const response = await fetch("https://api.firecrawl.dev/v1/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: searchQuery,
          limit: 10,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("Firecrawl search error:", response.status, text);
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Firecrawl credits exhausted." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ error: "Search failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const results = (data.data || []).map((r: any) => ({
        title: r.title || "",
        url: r.url || "",
        description: r.description || "",
        source: (r.url || "").includes("cifraclub") ? "CifraClub" : "Ultimate Guitar",
      }));

      return new Response(JSON.stringify({ results }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── ACTION: fetch ──
    if (action === "fetch") {
      if (!url || typeof url !== "string") {
        return new Response(JSON.stringify({ error: "A URL is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("Firecrawl scrape:", url);

      const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          formats: ["markdown"],
          onlyMainContent: true,
          waitFor: 3000,
        }),
      });

      if (!scrapeResponse.ok) {
        const text = await scrapeResponse.text();
        console.error("Firecrawl scrape error:", scrapeResponse.status, text);
        return new Response(JSON.stringify({ error: "Failed to scrape page" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const scrapeData = await scrapeResponse.json();
      const markdown = scrapeData.data?.markdown || scrapeData.markdown || "";

      // Use AI to clean the scraped markdown into a proper chord sheet
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        // Fallback: return raw markdown if no AI key
        return new Response(JSON.stringify({ content: markdown }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `You are a chord sheet formatter. Given raw scraped content from a chord website, extract and output ONLY the clean chord sheet with:
- Song title and artist on the first line
- If the song uses a capo, include "Capo: X" on the second line (where X is the fret number). This is very important — look for capo information in the original content and always include it if present.
- Section labels like [Intro], [Verse 1], [Chorus], [Bridge], [Outro]
- Chord names on their own line above the lyric line they apply to
- Proper alignment of chords to syllables
- Remove all ads, navigation, comments, ratings, and other website clutter
- Output ONLY the chord sheet, nothing else
- If the content doesn't contain chords/lyrics, say "Could not extract chord sheet from this page."`,
            },
            {
              role: "user",
              content: `Extract and clean the chord sheet from this scraped content:\n\n${markdown.slice(0, 15000)}`,
            },
          ],
        }),
      });

      if (!aiResponse.ok) {
        // Fallback to raw markdown
        console.error("AI cleanup failed:", aiResponse.status);
        return new Response(JSON.stringify({ content: markdown }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const aiData = await aiResponse.json();
      const cleanContent = aiData.choices?.[0]?.message?.content || markdown;

      return new Response(JSON.stringify({ content: cleanContent }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action. Use 'search' or 'fetch'." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("search-chords error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
