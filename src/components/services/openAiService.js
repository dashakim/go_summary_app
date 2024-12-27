export class OpenAiService {
  constructor() {
    this.apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    this.maxRetries = 3;
    this.retryDelay = 1000;
    this.requestQueue = [];
    this.isProcessing = false;
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) return;

    this.isProcessing = true;
    while (this.requestQueue.length > 0) {
      const { email, resolve, reject } = this.requestQueue.shift();
      try {
        const result = await this.makeRequest(email);
        resolve(result);
        await this.sleep(1000);
      } catch (error) {
        reject(error);
      }
    }
    this.isProcessing = false;
  }

  async makeRequest(email, retryCount = 0) {
    try {
      const content = {
        subject: email.payload.headers.find((h) => h.name === 'Subject')?.value || 'No Subject',
        from: email.payload.headers.find((h) => h.name === 'From')?.value || 'Unknown',
        content: email.snippet || '',
      };

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content:
                'You are an email summarizer. Your task is to extract key information and return it in JSON format. Remove any markdown formatting from your response.',
            },
            {
              role: 'user',
              content: `Analyze this email and respond with a JSON object containing:
              - mainPoints: A 2-3 sentence summary of the core message
              - actionItems: Array of specific actions required
              - needsResponse: Boolean indicating if a response is expected
              
              Email:
              Subject: ${content.subject}
              From: ${content.from}
              Content: ${content.content}`,
            },
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'API request failed');
      }

      const data = await response.json();
      const responseContent = data.choices?.[0]?.message?.content;

      if (!responseContent) {
        throw new Error('Invalid response format from OpenAI');
      }

      const cleanedContent = responseContent
        .replace(/```json\s*/, '')
        .replace(/```\s*$/, '')
        .trim();

      return {
        ...JSON.parse(cleanedContent),
        error: null,
      };
    } catch (error) {
      console.error('OpenAI API error:', error);

      if (error.message?.includes('429') && retryCount < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(2, retryCount);
        await this.sleep(delay);
        return this.makeRequest(email, retryCount + 1);
      }

      return {
        mainPoints: `Failed to analyze: ${email.snippet}`,
        actionItems: [],
        needsResponse: false,
        error: 'Failed to generate AI summary',
      };
    }
  }
  async summarizeEmail(email) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ email, resolve, reject });
      this.processQueue();
    });
  }
}

export const openAiService = new OpenAiService();
