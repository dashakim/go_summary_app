export class GoogleAuthService {
  constructor() {
    this.accessToken = null;
    this.tokenKey = 'gmail_summary_token';
  }

  getStoredToken() {
    try {
      const tokenData = localStorage.getItem(this.tokenKey);
      if (tokenData) {
        const { token, expiry } = JSON.parse(tokenData);
        if (new Date().getTime() < expiry) {
          this.accessToken = token;
          return token;
        }
        localStorage.removeItem(this.tokenKey);
      }
    } catch (error) {
      console.error('Error reading stored token:', error);
    }
    return null;
  }

  storeToken(token, expiresIn) {
    try {
      const expiry = new Date().getTime() + expiresIn * 1000;
      localStorage.setItem(
        this.tokenKey,
        JSON.stringify({
          token,
          expiry,
        }),
      );
    } catch (error) {
      console.error('Error storing token:', error);
    }
  }

  async requestAccessToken() {
    try {
      const storedToken = this.getStoredToken();
      if (storedToken) {
        this.accessToken = storedToken;
        return { access_token: storedToken };
      }

      if (!window.google?.accounts?.oauth2) {
        throw new Error('Google Identity Services not loaded');
      }

      return new Promise((resolve, reject) => {
        try {
          const tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: process.env.REACT_APP_GMAIL_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/gmail.readonly',
            callback: (response) => {
              if (response.error) {
                reject(response);
                return;
              }

              this.accessToken = response.access_token;
              this.storeToken(response.access_token, response.expires_in);
              resolve(response);
            },
          });

          tokenClient.requestAccessToken();
        } catch (err) {
          reject(err);
        }
      });
    } catch (error) {
      throw error;
    }
  }

  async checkAuthStatus() {
    const token = this.getStoredToken();
    if (!token) return false;

    try {
      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error checking auth status:', error);
      return false;
    }
  }

  async fetchEmails() {
    if (!this.accessToken) {
      const token = this.getStoredToken();
      if (!token) {
        throw new Error('Not authenticated');
      }
      this.accessToken = token;
    }

    try {
      const timestamp = new Date().getTime();
      const response = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=in:inbox is:unread label:UNREAD&maxResults=20&_=${timestamp}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
        },
      );

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem(this.tokenKey);
          throw new Error('Authentication expired');
        }
        throw new Error('Failed to fetch emails');
      }

      const data = await response.json();

      if (!data.messages) {
        return [];
      }

      const emails = await Promise.all(
        data.messages.map(async (message) => {
          const emailResponse = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=full&_=${timestamp}`,
            {
              headers: {
                Authorization: `Bearer ${this.accessToken}`,
                'Cache-Control': 'no-cache',
                Pragma: 'no-cache',
              },
            },
          );
          if (!emailResponse.ok) {
            throw new Error('Failed to fetch email details');
          }
          const emailData = await emailResponse.json();

          if (!emailData.labelIds?.includes('UNREAD')) {
            return null;
          }

          return emailData;
        }),
      );

      return emails.filter((email) => email !== null);
    } catch (error) {
      throw error;
    }
  }
  logout() {
    this.accessToken = null;
    localStorage.removeItem(this.tokenKey);
  }
}

export const googleAuthService = new GoogleAuthService();
