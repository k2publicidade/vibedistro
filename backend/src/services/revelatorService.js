const axios = require('axios');

class RevelatorService {
    constructor() {
        this.baseUrl = process.env.REVELATOR_API_URL || 'https://api.revelator.com';
        this.token = process.env.REVELATOR_API_TOKEN;
        this.clientId = process.env.REVELATOR_CLIENT_ID;
        this.clientSecret = process.env.REVELATOR_CLIENT_SECRET;
        this.tokenExpiresAt = 0;
    }

    async getAccessToken() {
        if (this.token && !this.clientId) {
            return this.token;
        }

        if (Date.now() < this.tokenExpiresAt) {
            return this.token;
        }

        try {
            // Implement OAuth/Token fetch logic here if using Client ID/Secret
            // This is a placeholder for the actual auth flow documentated by Revelator
            // For now we assume a static token or mock implementation
            console.log('Fetching new access token...');
            // const response = await axios.post(`${this.baseUrl}/auth/token`, { ... });
            // this.token = response.data.access_token;
            // this.tokenExpiresAt = Date.now() + (response.data.expires_in * 1000);
            return this.token;
        } catch (error) {
            console.error('Error fetching access token:', error);
            throw error;
        }
    }

    async request(method, endpoint, data = null, params = null) {
        try {
            const token = await this.getAccessToken();
            const config = {
                method,
                url: `${this.baseUrl}${endpoint}`,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                params,
                data
            };

            const response = await axios(config);
            return response.data;
        } catch (error) {
            console.error(`Revelator API Error [${method} ${endpoint}]:`, error.response?.data || error.message);
            throw error;
        }
    }

    // Catalog Methods
    async getReleases(params) {
        return this.request('GET', '/catalog/releases', null, params);
    }

    async getReleaseDetails(id) {
        return this.request('GET', `/catalog/releases/${id}`);
    }

    // Distribution Methods
    async distributeRelease(releaseId, dsps) {
        return this.request('POST', `/distribution/deliver`, { releaseId, dsps });
    }

    // Analytics Methods
    async getDailyTrends() {
        // Example endpoint, replace with actual doc endpoint
        return this.request('GET', '/analytics/trends/daily');
    }
}

module.exports = new RevelatorService();
