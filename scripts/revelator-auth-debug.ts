/**
 * Revelator auth debug — testa variacoes de payload pra isolar 500.
 */
import axios, { AxiosError } from 'axios';

const API_KEY = process.env['REVELATOR_PARTNER_API_KEY']!;
const USER_ID = process.env['REVELATOR_PARTNER_USER_ID']!;
const BASE = 'https://api.revelator.com';

console.log('Testing with:');
console.log('  apiKey:', API_KEY.slice(0, 4) + '...' + API_KEY.slice(-4));
console.log('  userId:', USER_ID);
console.log('');

const variants: Array<[string, unknown, Record<string, string>?]> = [
  ['v1 camelCase', { partnerApiKey: API_KEY, partnerUserId: USER_ID }],
  ['v2 PascalCase', { PartnerApiKey: API_KEY, PartnerUserId: USER_ID }],
  ['v3 snake_case', { partner_api_key: API_KEY, partner_user_id: USER_ID }],
  ['v4 apiKey+userId only', { apiKey: API_KEY, userId: USER_ID }],
  ['v5 PascalCase no body (query)', {}, { 'X-API-Key': API_KEY, 'X-User-ID': USER_ID }],
  ['v6 Bearer apiKey no body', {}, { Authorization: `Bearer ${API_KEY}` }],
];

const endpoints = [
  '/account/loginpartner',
  '/Account/LoginPartner',
  '/api/account/loginpartner',
  '/v1/account/loginpartner',
];

async function probe() {
  for (const endpoint of endpoints) {
    console.log(`\n=== ${endpoint} ===`);
    for (const [label, body, extraHeaders] of variants) {
      try {
        const resp = await axios.post(`${BASE}${endpoint}`, body, {
          timeout: 15_000,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...(extraHeaders ?? {}),
          },
          validateStatus: () => true,
        });
        const short = typeof resp.data === 'string'
          ? resp.data.slice(0, 80)
          : JSON.stringify(resp.data).slice(0, 140);
        console.log(`  [${resp.status}] ${label} → ${short}`);
      } catch (err) {
        const e = err as AxiosError;
        console.log(`  [ERR] ${label} → ${e.code ?? e.message}`);
      }
    }
  }

  // Also probe GET endpoints (maybe swagger / health)
  console.log('\n=== Discovery GETs ===');
  for (const path of ['/', '/swagger', '/swagger/v1/swagger.json', '/health']) {
    try {
      const resp = await axios.get(`${BASE}${path}`, { timeout: 10_000, validateStatus: () => true });
      const short = typeof resp.data === 'string' ? resp.data.slice(0, 100) : JSON.stringify(resp.data).slice(0, 140);
      console.log(`  GET ${path} [${resp.status}] ${short}`);
    } catch (err) {
      const e = err as AxiosError;
      console.log(`  GET ${path} [ERR] ${e.code ?? e.message}`);
    }
  }
}

probe();
