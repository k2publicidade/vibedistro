/**
 * Revelator sandbox probe — Fase A.
 *
 * Valida auth + health + lista catalogo atual + descobre stores disponiveis.
 * Nao grava nada, so leitura.
 *
 * Run: npx tsx scripts/revelator-probe.ts
 */
import 'dotenv/config';
import {
  RevelatorAuthClient,
  RevelatorProvider,
  createRevelatorConfig,
} from '../packages/integrations/src/revelator';
import axios from 'axios';

const MASK = (s: string | undefined) =>
  !s ? '(empty)' : s.length <= 8 ? '***' : `${s.slice(0, 4)}...${s.slice(-4)}`;

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  VibeDistro — Revelator Probe (Fase A)');
  console.log('═══════════════════════════════════════════════════\n');

  const config = createRevelatorConfig(process.env);

  console.log('[config]');
  console.log('  baseUrl:         ', config.baseUrl);
  console.log('  environment:     ', config.environment);
  console.log('  enabled:         ', config.enabled);
  console.log('  partnerApiKey:   ', MASK(config.partnerApiKey));
  console.log('  partnerUserId:   ', MASK(config.partnerUserId));
  console.log('  enterpriseId env:', config.enterpriseId);
  console.log('  webhookSecret:   ', MASK(config.webhookSecret));
  console.log('');

  if (!config.partnerApiKey || !config.partnerUserId) {
    console.error('[FATAL] REVELATOR_PARTNER_API_KEY ou REVELATOR_PARTNER_USER_ID nao definidos');
    process.exit(1);
  }

  // ─────────────────────────────────────────────────────────────
  // 1. AUTH
  // ─────────────────────────────────────────────────────────────
  console.log('[1/5] Autenticando...');
  const auth = new RevelatorAuthClient(config);
  const provider = new RevelatorProvider(config, auth);

  try {
    await provider.authenticate();
    const token = await auth.getAccessToken();
    const entId = await auth.getEnterpriseId();
    console.log(`  ✅ token:        ${MASK(token)}`);
    console.log(`  ✅ enterpriseId: ${entId}`);
  } catch (err: any) {
    console.error('  ❌ AUTH FALHOU:', err.response?.status, err.response?.data ?? err.message);
    process.exit(1);
  }
  console.log('');

  // ─────────────────────────────────────────────────────────────
  // 2. HEALTH
  // ─────────────────────────────────────────────────────────────
  console.log('[2/5] Health check...');
  const health = await provider.healthCheck();
  console.log(`  ${health.healthy ? '✅' : '❌'} healthy=${health.healthy} latency=${health.latencyMs}ms`);
  if (!health.healthy) console.log(`     error: ${health.error}`);
  console.log('');

  // HTTP cliente direto pra chamadas ad-hoc (stores, etc.)
  const token = await auth.getAccessToken();
  const http = axios.create({
    baseURL: config.baseUrl,
    timeout: 30_000,
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });

  // ─────────────────────────────────────────────────────────────
  // 3. CATALOG
  // ─────────────────────────────────────────────────────────────
  console.log('[3/5] Listando catalogo atual (enterpriseId=' + (await auth.getEnterpriseId()) + ')...');

  try {
    const artists = await provider.listArtists(100);
    console.log(`  📀 artistas: ${artists.length}`);
    artists.slice(0, 5).forEach((a, i) => {
      console.log(`     ${i + 1}. id=${a['artistId'] ?? a['id']} name="${a['stageName'] ?? a['name']}"`);
    });
    if (artists.length > 5) console.log(`     ...e mais ${artists.length - 5}`);
  } catch (err: any) {
    console.error('  ❌ listArtists:', err.response?.status, err.response?.data?.message ?? err.message);
  }

  try {
    const releases = await provider.listReleases(100);
    console.log(`  💿 releases: ${releases.length}`);
    releases.slice(0, 5).forEach((r, i) => {
      console.log(
        `     ${i + 1}. id=${r['releaseId'] ?? r['id']} name="${r['name']}" status=${r['releaseStatus'] ?? r['status'] ?? 'n/a'}`,
      );
    });
    if (releases.length > 5) console.log(`     ...e mais ${releases.length - 5}`);
  } catch (err: any) {
    console.error('  ❌ listReleases:', err.response?.status, err.response?.data?.message ?? err.message);
  }

  try {
    const tracks = await provider.listTracks(100);
    console.log(`  🎵 tracks: ${tracks.length}`);
    tracks.slice(0, 5).forEach((t, i) => {
      console.log(`     ${i + 1}. id=${t['trackId'] ?? t['id']} name="${t['name']}" isrc=${t['isrc'] ?? 'n/a'}`);
    });
    if (tracks.length > 5) console.log(`     ...e mais ${tracks.length - 5}`);
  } catch (err: any) {
    console.error('  ❌ listTracks:', err.response?.status, err.response?.data?.message ?? err.message);
  }
  console.log('');

  // ─────────────────────────────────────────────────────────────
  // 4. STORES DISPONIVEIS (DSPs)
  // ─────────────────────────────────────────────────────────────
  console.log('[4/5] Descobrindo DSPs disponiveis na conta...');
  try {
    const resp = await http.get('/distribution/store/allactives');
    const data = resp.data as { items?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>;
    const items = Array.isArray(data) ? data : (data.items ?? []);
    console.log(`  🏪 stores ativos: ${items.length}`);
    items.forEach((s, i) => {
      console.log(
        `     ${i + 1}. id=${s['storeId'] ?? s['id']} name="${s['name'] ?? s['storeName']}" code=${s['storeCode'] ?? 'n/a'}`,
      );
    });
  } catch (err: any) {
    console.error('  ❌ allactives:', err.response?.status, err.response?.data?.message ?? err.message);
  }
  console.log('');

  // ─────────────────────────────────────────────────────────────
  // 5. LOOKUPS (release types, genres, languages)
  // ─────────────────────────────────────────────────────────────
  console.log('[5/5] Descobrindo lookups (generos/tipos/linguagens)...');
  for (const lookup of ['releasetypes', 'musicstyles', 'languages']) {
    try {
      const resp = await http.get(`/common/lookup/${lookup}`);
      const data = resp.data as { items?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>;
      const items = Array.isArray(data) ? data : (data.items ?? []);
      console.log(`  📋 ${lookup}: ${items.length} entries`);
      items.slice(0, 3).forEach((it) => {
        console.log(`     - id=${it['id']} name="${it['name']}"`);
      });
      if (items.length > 3) console.log(`     ...e mais ${items.length - 3}`);
    } catch (err: any) {
      console.error(`  ❌ ${lookup}:`, err.response?.status, err.response?.data?.message ?? err.message);
    }
  }
  console.log('');

  console.log('═══════════════════════════════════════════════════');
  console.log('  Probe concluido.');
  console.log('═══════════════════════════════════════════════════');
}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
