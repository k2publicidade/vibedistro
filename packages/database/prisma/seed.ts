import { PrismaClient } from '../src/generated';

const prisma = new PrismaClient();

// Pre-computed bcrypt hash for "admin123" (10 rounds)
const ADMIN_PASSWORD_HASH = '$2a$10$/QTk3kQBPjBSQykouGDf3Ot0KsZcvF0sY0pemNqaV92ERHqaaIMYC';

async function main() {
  console.log('🌱 Seeding database...');

  // System permissions
  const permissionDefs = [
    // Artists
    { resource: 'artist', action: 'create', scope: 'tenant' },
    { resource: 'artist', action: 'read', scope: 'tenant' },
    { resource: 'artist', action: 'update', scope: 'tenant' },
    { resource: 'artist', action: 'delete', scope: 'tenant' },
    // Releases
    { resource: 'release', action: 'create', scope: 'tenant' },
    { resource: 'release', action: 'read', scope: 'tenant' },
    { resource: 'release', action: 'update', scope: 'tenant' },
    { resource: 'release', action: 'delete', scope: 'tenant' },
    { resource: 'release', action: 'approve', scope: 'tenant' },
    { resource: 'release', action: 'submit', scope: 'tenant' },
    // Royalties
    { resource: 'royalty', action: 'read', scope: 'tenant' },
    { resource: 'royalty', action: 'export', scope: 'tenant' },
    // Payouts
    { resource: 'payout', action: 'create', scope: 'tenant' },
    { resource: 'payout', action: 'read', scope: 'tenant' },
    { resource: 'payout', action: 'approve', scope: 'tenant' },
    // Users
    { resource: 'user', action: 'create', scope: 'tenant' },
    { resource: 'user', action: 'read', scope: 'tenant' },
    { resource: 'user', action: 'update', scope: 'tenant' },
    { resource: 'user', action: 'delete', scope: 'tenant' },
    // Tickets
    { resource: 'ticket', action: 'create', scope: 'tenant' },
    { resource: 'ticket', action: 'read', scope: 'tenant' },
    { resource: 'ticket', action: 'update', scope: 'tenant' },
    // Audit
    { resource: 'audit_log', action: 'read', scope: 'tenant' },
    // Tenants (global)
    { resource: 'tenant', action: 'create', scope: 'global' },
    { resource: 'tenant', action: 'read', scope: 'global' },
    { resource: 'tenant', action: 'update', scope: 'global' },
    { resource: 'tenant', action: 'delete', scope: 'global' },
    // Integrations
    { resource: 'integration', action: 'read', scope: 'tenant' },
    { resource: 'integration', action: 'manage', scope: 'global' },
  ];

  for (const perm of permissionDefs) {
    await prisma.permission.upsert({
      where: { resource_action_scope: perm },
      create: perm,
      update: {},
    });
  }

  // System roles — use findFirst + create because tenantId is nullable (upsert doesn't support null in compound unique)
  async function upsertSystemRole(slug: string, name: string, description: string) {
    const existing = await prisma.role.findFirst({ where: { slug, tenantId: null } });
    if (existing) return existing;
    return prisma.role.create({ data: { name, slug, isSystem: true, tenantId: null, description } });
  }

  const superAdminRole = await upsertSystemRole('super_admin', 'Super Admin', 'Full platform access');
  const labelOwnerRole = await upsertSystemRole('label_owner', 'Label Owner', 'Full access to own tenant');
  const catalogManagerRole = await upsertSystemRole('catalog_manager', 'Catalog Manager', 'Manages releases and tracks');
  const artistRole = await upsertSystemRole('artist', 'Artist', 'Artist with read access to own content');

  // Assign all permissions to super_admin
  const allPermissions = await prisma.permission.findMany();
  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: perm.id } },
      create: { roleId: superAdminRole.id, permissionId: perm.id },
      update: {},
    });
  }

  // Assign tenant-scoped permissions to label_owner
  const tenantPermissions = allPermissions.filter((p) => p.scope === 'tenant');
  for (const perm of tenantPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: labelOwnerRole.id, permissionId: perm.id } },
      create: { roleId: labelOwnerRole.id, permissionId: perm.id },
      update: {},
    });
  }

  // Create default tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'vibedistro-sandbox' },
    create: {
      slug: 'vibedistro-sandbox',
      name: 'Vibe Distro Sandbox',
      status: 'ACTIVE',
      plan: 'PRO',
      maxArtists: 100,
      maxReleases: 500,
      maxStorageGb: 50,
    },
    update: {},
  });

  // Create admin user (password: admin123)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@vibedistro.com' },
    create: {
      email: 'admin@vibedistro.com',
      passwordHash: ADMIN_PASSWORD_HASH,
      firstName: 'Admin',
      lastName: 'VibeDistro',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      onboardingStatus: 'COMPLETED',
    },
    update: {},
  });

  // Link admin to tenant with super_admin role
  await prisma.userTenant.upsert({
    where: { userId_tenantId: { userId: adminUser.id, tenantId: tenant.id } },
    create: {
      userId: adminUser.id,
      tenantId: tenant.id,
      roleId: superAdminRole.id,
      isOwner: true,
    },
    update: {},
  });

  // Create Revelator integration connection
  await prisma.integrationConnection.upsert({
    where: {
      tenantId_provider_environment: {
        tenantId: tenant.id,
        provider: 'revelator',
        environment: 'SANDBOX',
      },
    },
    create: {
      tenantId: tenant.id,
      provider: 'revelator',
      environment: 'SANDBOX',
      enabled: true,
      config: {
        enterpriseId: 893945,
        partnerApiKey: '53ad6a23-5436-4461-a523-0d3b90b82701',
      },
    },
    update: {},
  });

  // Create tenant branding
  await prisma.tenantBranding.upsert({
    where: { tenantId: tenant.id },
    create: {
      tenantId: tenant.id,
      primaryColor: '#6366f1',
      secondaryColor: '#8b5cf6',
      accentColor: '#06b6d4',
      supportEmail: 'suporte@vibedistro.com',
    },
    update: {},
  });

  console.log('✅ Seed complete');
  console.log(`  Permissions: ${allPermissions.length}`);
  console.log(`  Roles: super_admin, label_owner, catalog_manager, artist`);
  console.log(`  Tenant: ${tenant.slug} (${tenant.id})`);
  console.log(`  Admin: admin@vibedistro.com / admin123`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
