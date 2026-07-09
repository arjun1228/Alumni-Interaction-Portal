import Groq from 'groq-sdk';

let groq = null;

export const generateCompletion = async ({ systemPrompt, messages, temperature = 0.7 }) => {
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
    throw new Error('GROQ_API_KEY is not configured correctly on the server (placeholder detected).');
  }

  if (!groq) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature,
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    // Catch Groq rate limit responses (HTTP 429) and log server-side only
    if (error.status === 429 || (error.message && error.message.includes('429'))) {
      console.warn('⚠️ Groq API Rate Limit (429) reached. Logging server-side only.', error.message);
      return "The AI mentor is temporarily busy — please try again in a moment.";
    }
    console.error('Groq Service Completion Error:', error);
    throw error;
  }
};
