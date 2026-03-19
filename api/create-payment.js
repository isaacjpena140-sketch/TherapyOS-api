const stripe = require('stripe');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { amount, patientName, claimNumber, description } = req.body;

  if (!amount || !patientName) {
    return res.status(400).json({ error: 'Missing amount or patientName' });
  }

  try {
    const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Patient Balance — ${patientName}`,
            description: description || `Claim ${claimNumber}`,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.APP_URL}?payment=success&claim=${claimNumber}`,
      cancel_url: `${process.env.APP_URL}?payment=cancelled`,
      metadata: {
        patientName,
        claimNumber,
      },
    });

    return res.status(200).json({ 
      success: true,
      checkoutUrl: session.url 
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
