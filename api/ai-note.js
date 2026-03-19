const Anthropic = require('@anthropic-ai/sdk');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { section, noteData } = req.body;

  const prompts = {
    subjective: `You are a physical therapy documentation assistant. Write a professional Subjective section for a SOAP note based on this information: Pain level today: ${noteData.pain_today}/10, Pain last visit: ${noteData.pain_last_visit}/10, HEP Compliance: ${noteData.hep_compliance}, Patient reports: ${noteData.subjective_patient_reports}. Write 2-3 concise clinical sentences. Do not use patient names. Use professional PT/OT terminology.`,
    
    assessment: `You are a physical therapy documentation assistant. Write a professional Assessment section for a SOAP note based on this information: Progress toward goals: ${noteData.progress_toward_goals}, Interventions provided: ${(noteData.interventions || []).join(', ')}, Pain today: ${noteData.pain_today}/10. Write 2-3 concise clinical sentences justifying medical necessity and progress. Use professional PT/OT terminology.`,
    
    plan: `You are a physical therapy documentation assistant. Write a professional Plan section for a SOAP note based on this information: Interventions used: ${(noteData.interventions || []).join(', ')}, Progress: ${noteData.progress_toward_goals}. Write 2-3 concise clinical sentences describing the plan for future visits. Use professional PT/OT terminology.`,
    
    clinical_reasoning: `You are a physical therapy documentation assistant. Write a professional Clinical Reasoning section based on this information: Interventions: ${(noteData.interventions || []).join(', ')}, Progress toward goals: ${noteData.progress_toward_goals}, Pain: ${noteData.pain_today}/10. Write 2-3 sentences explaining clinical decision making. Use professional PT/OT terminology.`,
  };

  const prompt = prompts[section];
  if (!prompt) {
    return res.status(400).json({ error: 'Invalid section. Use: subjective, assessment, plan, clinical_reasoning' });
  }

  try {
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    return res.status(200).json({ 
      success: true,
      text: message.content[0].text 
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
