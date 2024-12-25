export class GoogleAuthService {
  constructor() {
    this.accessToken = null;
  }

  async requestAccessToken() {
    try {
      if (!window.google?.accounts?.oauth2) {
        throw new Error('Google Identity Services not loaded');
      }

      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: process.env.REACT_APP_GMAIL_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/gmail.readonly',
        callback: '',
      });

      return new Promise((resolve, reject) => {
        try {
          tokenClient.callback = (response) => {
            if (response.error !== undefined) {
              reject(response);
            }
            this.accessToken = response.access_token;
            resolve(response);
          };
          tokenClient.requestAccessToken();
        } catch (err) {
          reject(err);
        }
      });
    } catch (error) {
      throw error;
    }
  }

  async fetchEmails() {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=20',
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        },
      );

      const data = await response.json();

      if (!data.messages) {
        return [];
      }

      const emails = await Promise.all(
        data.messages.map(async (message) => {
          const emailResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`, {
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
            },
          });
          return emailResponse.json();
        }),
      );

      return emails;
    } catch (error) {
      throw error;
    }
  }
}

export const googleAuthService = new GoogleAuthService();
