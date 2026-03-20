export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { section, noteData } = req.body;

  const prompts = {
    subjective: `You are a physical therapy documentation assistant. Write 2-3 professional clinical sentences for the Subjective section of a SOAP note. Pain today: ${noteData?.pain_today || 'not recorded'}/10. HEP Compliance: ${noteData?.hep_compliance || 'not recorded'}. Use PT/OT terminology.`,
    assessment: `You are a physical therapy documentation assistant. Write 2-3 professional clinical sentences for the Assessment section of a SOAP note. Progress: ${noteData?.progress_toward_goals || 'not recorded'}. Interventions: ${(noteData?.interventions || []).join(', ') || 'not recorded'}. Use PT/OT terminology.`,
    plan: `You are a physical therapy documentation assistant. Write 2-3 professional clinical sentences for the Plan section of a SOAP note. Interventions: ${(noteData?.interventions || []).join(', ') || 'not recorded'}. Use PT/OT terminology.`,
    clinical_reasoning: `You are a physical therapy documentation assistant. Write 2-3 professional clinical sentences for Clinical Reasoning. Progress: ${noteData?.progress_toward_goals || 'not recorded'}. Use PT/OT terminology.`,
  };

  const prompt = prompts[section];
  if (!prompt) {
    return res.status(400).json({ error: 'Invalid section: ' + section });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY environment variable is not set' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const responseText = await response.text();
    console.log('Anthropic response status:', response.status);
    console.log('Anthropic response body:', responseText);

    if (!response.ok) {
      return res.status(500).json({ 
        error: `Anthropic API error ${response.status}: ${responseText}` 
      });
    }

    const data = JSON.parse(responseText);
    const text = data.content?.[0]?.text || '';

    return res.status(200).json({ success: true, text });
  } catch (error) {
    console.log('Catch error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
