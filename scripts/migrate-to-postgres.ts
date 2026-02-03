#!/usr/bin/env tsx

/**
 * Script de migração de dados do SQLite para PostgreSQL
 *
 * Este script lê todos os dados do banco SQLite, transforma os campos
 * que eram strings (arrays e JSON) para os tipos nativos do PostgreSQL,
 * e insere no novo banco.
 *
 * Uso:
 *   DATABASE_URL=file:./dev.db DATABASE_URL_POSTGRES=postgresql://user:pass@localhost:5432/db npm run migrate:postgres
 */

import Database from 'better-sqlite3';
import { Client } from 'pg';

const BATCH_SIZE = 100;

// Funções auxiliares para transformação de dados
function parseCommaSeparated(value: string | null | undefined): string[] {
  if (!value || value.trim() === '') return [];
  return value.split(',').map(s => s.trim()).filter(s => s.length > 0);
}

function parseJson(value: string | null | undefined): any {
  if (!value || value.trim() === '') return null;
  try {
    return JSON.parse(value);
  } catch (e) {
    console.warn(`Falha ao fazer parse de JSON: ${value}`, e);
    return null;
  }
}

// Extrair caminho do arquivo do DATABASE_URL (file:./dev.db -> ./dev.db)
function extractSqlitePath(url: string): string {
  if (url.startsWith('file:')) {
    return url.substring(5);
  }
  return url;
}

async function migrateAgencies(sqlite: Database.Database, postgres: Client) {
  console.log('\n📦 Migrando Agencies...');

  const agencies = sqlite.prepare('SELECT * FROM Agency').all();
  console.log(`   Encontradas ${agencies.length} agencies`);

  for (const agency of agencies as any[]) {
    await postgres.query(
      `INSERT INTO "Agency" (id, name, website, socials, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        agency.id,
        agency.name,
        agency.website,
        parseJson(agency.socials),
        new Date(agency.createdAt),
        new Date(agency.updatedAt)
      ]
    );
  }

  console.log('   ✅ Agencies migradas com sucesso');
}

async function migrateArtists(sqlite: Database.Database, postgres: Client) {
  console.log('\n👤 Migrando Artists...');

  const artists = sqlite.prepare('SELECT * FROM Artist').all();
  console.log(`   Encontrados ${artists.length} artists`);

  for (const artist of artists as any[]) {
    await postgres.query(
      `INSERT INTO "Artist" (id, "nameRomanized", "nameHangul", "birthDate", "stageNames", roles, bio, "primaryImageUrl", "socialLinks", "agencyId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        artist.id,
        artist.nameRomanized,
        artist.nameHangul,
        artist.birthDate ? new Date(artist.birthDate) : null,
        parseCommaSeparated(artist.stageNames),
        parseCommaSeparated(artist.roles),
        artist.bio,
        artist.primaryImageUrl,
        parseJson(artist.socialLinks),
        artist.agencyId,
        new Date(artist.createdAt),
        new Date(artist.updatedAt)
      ]
    );
  }

  console.log('   ✅ Artists migrados com sucesso');
}

async function migrateProductions(sqlite: Database.Database, postgres: Client) {
  console.log('\n🎬 Migrando Productions...');

  const productions = sqlite.prepare('SELECT * FROM Production').all();
  console.log(`   Encontradas ${productions.length} productions`);

  for (const production of productions as any[]) {
    await postgres.query(
      `INSERT INTO "Production" (id, "titlePt", "titleKr", type, year, synopsis, "imageUrl", "streamingPlatforms", "sourceUrls", tags, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        production.id,
        production.titlePt,
        production.titleKr,
        production.type,
        production.year,
        production.synopsis,
        production.imageUrl,
        parseCommaSeparated(production.streamingPlatforms),
        parseCommaSeparated(production.sourceUrls),
        parseCommaSeparated(production.tags),
        new Date(production.createdAt),
        new Date(production.updatedAt)
      ]
    );
  }

  console.log('   ✅ Productions migradas com sucesso');
}

async function migrateArtistProductions(sqlite: Database.Database, postgres: Client) {
  console.log('\n🔗 Migrando ArtistProductions (relacionamentos)...');

  const artistProductions = sqlite.prepare('SELECT * FROM ArtistProduction').all();
  console.log(`   Encontrados ${artistProductions.length} relacionamentos`);

  for (const ap of artistProductions as any[]) {
    await postgres.query(
      `INSERT INTO "ArtistProduction" ("artistId", "productionId", role)
       VALUES ($1, $2, $3)`,
      [ap.artistId, ap.productionId, ap.role]
    );
  }

  console.log('   ✅ ArtistProductions migrados com sucesso');
}

async function migrateNews(sqlite: Database.Database, postgres: Client) {
  console.log('\n📰 Migrando News...');

  const news = sqlite.prepare('SELECT * FROM News').all();
  console.log(`   Encontradas ${news.length} notícias`);

  for (const newsItem of news as any[]) {
    await postgres.query(
      `INSERT INTO "News" (id, title, "contentMd", "sourceUrl", "publishedAt", "imageUrl", tags, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        newsItem.id,
        newsItem.title,
        newsItem.contentMd,
        newsItem.sourceUrl,
        new Date(newsItem.publishedAt),
        newsItem.imageUrl,
        parseCommaSeparated(newsItem.tags),
        new Date(newsItem.createdAt),
        new Date(newsItem.updatedAt)
      ]
    );
  }

  console.log('   ✅ News migradas com sucesso');
}

async function migrateImages(sqlite: Database.Database, postgres: Client) {
  console.log('\n🖼️  Migrando Images...');

  const images = sqlite.prepare('SELECT * FROM Image').all();
  console.log(`   Encontradas ${images.length} images`);

  for (const image of images as any[]) {
    await postgres.query(
      `INSERT INTO "Image" (id, "entityType", "entityId", url, credit, license, width, height, "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        image.id,
        image.entityType,
        image.entityId,
        image.url,
        image.credit,
        image.license,
        image.width,
        image.height,
        new Date(image.createdAt)
      ]
    );
  }

  console.log('   ✅ Images migradas com sucesso');
}

async function migrateUsers(sqlite: Database.Database, postgres: Client) {
  console.log('\n👥 Migrando Users...');

  const users = sqlite.prepare('SELECT * FROM User').all();
  console.log(`   Encontrados ${users.length} users`);

  for (const user of users as any[]) {
    await postgres.query(
      `INSERT INTO "User" (id, name, email, password, role, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        user.id,
        user.name,
        user.email,
        user.password,
        user.role,
        new Date(user.createdAt),
        new Date(user.updatedAt)
      ]
    );
  }

  console.log('   ✅ Users migrados com sucesso');
}

async function migrateTags(sqlite: Database.Database, postgres: Client) {
  console.log('\n🏷️  Migrando Tags...');

  const tags = sqlite.prepare('SELECT * FROM Tag').all();
  console.log(`   Encontradas ${tags.length} tags`);

  for (const tag of tags as any[]) {
    await postgres.query(
      `INSERT INTO "Tag" (id, name, type)
       VALUES ($1, $2, $3)`,
      [tag.id, tag.name, tag.type]
    );
  }

  console.log('   ✅ Tags migradas com sucesso');
}

async function verifyMigration(sqlite: Database.Database, postgres: Client) {
  console.log('\n🔍 Verificando migração...');

  const tables = [
    'Agency',
    'Artist',
    'Production',
    'ArtistProduction',
    'News',
    'Image',
    'User',
    'Tag'
  ];

  let allMatch = true;

  for (const table of tables) {
    const sqliteCount = sqlite.prepare(`SELECT COUNT(*) as count FROM "${table}"`).get() as any;
    const postgresResult = await postgres.query(`SELECT COUNT(*) FROM "${table}"`);
    const postgresCount = parseInt(postgresResult.rows[0].count);

    const match = sqliteCount.count === postgresCount;
    const icon = match ? '✅' : '❌';

    console.log(`   ${icon} ${table}: SQLite=${sqliteCount.count}, PostgreSQL=${postgresCount}`);

    if (!match) allMatch = false;
  }

  return allMatch;
}

async function main() {
  console.log('🚀 Iniciando migração do SQLite para PostgreSQL\n');

  const sqliteUrl = process.env.DATABASE_URL || 'file:./dev.db';
  const postgresUrl = process.env.DATABASE_URL_POSTGRES;

  console.log(`   SQLite: ${sqliteUrl}`);
  console.log(`   PostgreSQL: ${postgresUrl}`);

  if (!postgresUrl) {
    console.error('\n❌ Erro: DATABASE_URL_POSTGRES não definida');
    console.error('   Use: DATABASE_URL_POSTGRES=postgresql://user:pass@localhost:5432/db');
    process.exit(1);
  }

  const sqlitePath = extractSqlitePath(sqliteUrl);
  let sqlite: Database.Database | null = null;
  let postgres: Client | null = null;

  try {
    // Conectar ao SQLite
    console.log('\n🔌 Testando conexões...');
    sqlite = new Database(sqlitePath, { readonly: true });
    console.log('   ✅ Conectado ao SQLite');

    // Conectar ao PostgreSQL
    postgres = new Client({ connectionString: postgresUrl });
    await postgres.connect();
    console.log('   ✅ Conectado ao PostgreSQL');

    // Executar migrações na ordem correta (respeitando foreign keys)
    await migrateAgencies(sqlite, postgres);
    await migrateArtists(sqlite, postgres);
    await migrateProductions(sqlite, postgres);
    await migrateArtistProductions(sqlite, postgres);
    await migrateNews(sqlite, postgres);
    await migrateImages(sqlite, postgres);
    await migrateUsers(sqlite, postgres);
    await migrateTags(sqlite, postgres);

    // Verificar
    const verified = await verifyMigration(sqlite, postgres);

    if (verified) {
      console.log('\n✅ Migração concluída com sucesso!');
      console.log('   Todos os dados foram migrados corretamente.');
    } else {
      console.log('\n⚠️  Migração concluída com divergências');
      console.log('   Verifique os logs acima para detalhes.');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Erro durante a migração:', error);
    process.exit(1);
  } finally {
    if (sqlite) sqlite.close();
    if (postgres) await postgres.end();
  }
}

main();
