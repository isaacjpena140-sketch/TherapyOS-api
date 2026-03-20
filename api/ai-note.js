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
    subjective: `You are a physical therapy documentation assistant. Write a professional Subjective section for a SOAP note. Pain level today: ${noteData?.pain_today || 'not recorded'}/10. Pain last visit: ${noteData?.pain_last_visit || 'not recorded'}/10. HEP Compliance: ${noteData?.hep_compliance || 'not recorded'}. Patient reports: ${noteData?.subjective_patient_reports || 'not recorded'}. Write 2-3 concise clinical sentences. Use professional PT/OT terminology. Do not include patient names.`,
    assessment: `You are a physical therapy documentation assistant. Write a professional Assessment section for a SOAP note. Progress toward goals: ${noteData?.progress_toward_goals || 'not recorded'}. Interventions provided: ${(noteData?.interventions || []).join(', ') || 'not recorded'}. Pain today: ${noteData?.pain_today || 'not recorded'}/10. Write 2-3 concise clinical sentences justifying medical necessity. Use professional PT/OT terminology.`,
    plan: `You are a physical therapy documentation assistant. Write a professional Plan section for a SOAP note. Interventions used: ${(noteData?.interventions || []).join(', ') || 'not recorded'}. Progress: ${noteData?.progress_toward_goals || 'not recorded'}. Write 2-3 concise clinical sentences describing the treatment plan. Use professional PT/OT terminology.`,
    clinical_reasoning: `You are a physical therapy documentation assistant. Write a professional Clinical Reasoning section. Interventions: ${(noteData?.interventions || []).join(', ') || 'not recorded'}. Progress: ${noteData?.progress_toward_goals || 'not recorded'}. Pain: ${noteData?.pain_today || 'not recorded'}/10. Write 2-3 sentences explaining clinical decision making. Use professional PT/OT terminology.`,
  };

  const prompt = prompts[section];
  if (!prompt) {
    return res.status(400).json({ error: 'Invalid section' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(500).json({ error: `Anthropic API error: ${errText}` });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';

    return res.status(200).json({ success: true, text });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
