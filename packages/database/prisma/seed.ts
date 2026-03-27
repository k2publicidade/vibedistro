import { PrismaClient } from '../src/generated';

const prisma = new PrismaClient();

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

  // System roles
  const superAdminRole = await prisma.role.upsert({
    where: { slug_tenantId: { slug: 'super_admin', tenantId: null } },
    create: {
      name: 'Super Admin',
      slug: 'super_admin',
      isSystem: true,
      tenantId: null,
      description: 'Full platform access',
    },
    update: {},
  });

  const labelOwnerRole = await prisma.role.upsert({
    where: { slug_tenantId: { slug: 'label_owner', tenantId: null } },
    create: {
      name: 'Label Owner',
      slug: 'label_owner',
      isSystem: true,
      tenantId: null,
      description: 'Full access to own tenant',
    },
    update: {},
  });

  const catalogManagerRole = await prisma.role.upsert({
    where: { slug_tenantId: { slug: 'catalog_manager', tenantId: null } },
    create: {
      name: 'Catalog Manager',
      slug: 'catalog_manager',
      isSystem: true,
      tenantId: null,
      description: 'Manages releases and tracks',
    },
    update: {},
  });

  const artistRole = await prisma.role.upsert({
    where: { slug_tenantId: { slug: 'artist', tenantId: null } },
    create: {
      name: 'Artist',
      slug: 'artist',
      isSystem: true,
      tenantId: null,
      description: 'Artist with read access to own content',
    },
    update: {},
  });

  // Assign all permissions to super_admin
  const allPermissions = await prisma.permission.findMany();
  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: perm.id } },
      create: { roleId: superAdminRole.id, permissionId: perm.id },
      update: {},
    });
  }

  console.log('✅ Seed complete');
  console.log(`  Permissions: ${allPermissions.length}`);
  console.log(`  Roles: super_admin, label_owner, catalog_manager, artist`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
