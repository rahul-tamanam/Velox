function getGroqKey() {
  return (
    import.meta.env.VITE_GROQ_API_KEY ||
    import.meta.env.NEXT_PUBLIC_GROQ_API_KEY ||
    ''
  );
}

export async function fetchChartInsight(prompt) {
  const apiKey = getGroqKey().trim();
  if (!apiKey) {
    throw new Error('MISSING_KEY');
  }

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.55,
      max_tokens: 240,
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Groq HTTP ${res.status}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Empty response');
  return text;
}
