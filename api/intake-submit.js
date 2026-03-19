export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { patientId, demographics, medicalHistory } = req.body;

  if (!patientId) {
    return res.status(400).json({ error: 'Missing patientId' });
  }

  try {
    const updateData = {
      ...demographics,
      intake_completed: true,
      intake_completed_date: new Date().toISOString().split('T')[0],
    };

    const response = await fetch(
      `https://api.base44.com/api/apps/${process.env.BASE44_APP_ID}/entities/Patient/${patientId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.BASE44_API_KEY,
        },
        body: JSON.stringify(updateData),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Base44 error: ${err}`);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
