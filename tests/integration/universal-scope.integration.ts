/** Executes production repositories/resolver against a disposable PostGIS database. */
jest.mock('@/db', () => {
  const { Pool } = require('pg');
  const { drizzle } = require('drizzle-orm/node-postgres');
  const url = process.env.TEST_DATABASE_URL;
  if (!url || new URL(url).pathname !== '/prisma_scope_test') {
    throw new Error('TEST_DATABASE_URL must target disposable database prisma_scope_test');
  }
  const pool = new Pool({ connectionString: url });
  return { db: drizzle(pool), integrationPool: pool };
});
import { resolveTableLayer } from '@/lib/service/layer-resolver';
import { findAllFirmsData } from '@/lib/repositories/firmsRepository';
import { findAllDesmatamentoData } from '@/lib/repositories/desmatamentoReposiroty';
import { countPropriedades } from '@/lib/repositories/propriedadesRepository';
import { resolveTenantIdForUser } from '@/lib/api/require-auth';
import { getAccessibleRegionIdsForUser } from '@/lib/api/require-region';
import type { LayerScope } from '@/types/map-dto';
const pool = require('@/db').integrationPool;
const A = '00000000-0000-0000-0000-00000000000a';
const B = '00000000-0000-0000-0000-00000000000b';
const F = '00000000-0000-0000-0000-000000000001';
const G = '00000000-0000-0000-0000-000000000002';
const REVOKED = '00000000-0000-0000-0000-000000000003';
const ASSIGNED = '00000000-0000-0000-0000-000000000004';
beforeAll(async () => {
  await pool.query(`CREATE EXTENSION IF NOT EXISTS postgis;
    CREATE SCHEMA monitoramento;
    CREATE TABLE monitoramento.regioes (id int PRIMARY KEY, organization_id uuid, geom geometry(Polygon,4674));
    CREATE TABLE monitoramento.roles (id serial PRIMARY KEY, user_id uuid, tenant_id uuid, role text, region_id int);
    CREATE TABLE monitoramento.user_access (id serial PRIMARY KEY, user_id uuid, organization_id uuid, regiao_id int);
    CREATE TABLE monitoramento.acoes (id int PRIMARY KEY, tenant_id uuid, regiao_id int,
      acao text, name text, descricao text, mes text, atuacao text, status text, categoria text, tipo text,
      eixo_tematico text, tipo_tecnico text, carater text, time timestamp, geom geometry(Point,4674));
    CREATE TABLE monitoramento.estradas (id int PRIMARY KEY, tenant_id uuid, regiao_id int,
      nome text, tipo text, codigo text, geom geometry(LineString,4674));
    CREATE TABLE monitoramento.raw_firms (id uuid PRIMARY KEY, tenant_id uuid, regiao_id int, acq_date date,
      acq_time text, frp numeric, satellite text, cod_imovel text, latitude numeric, longitude numeric, geom geometry(Point,4674));
    CREATE TABLE monitoramento.desmatamento (id int PRIMARY KEY, tenant_id uuid, regiao_id int, alertid text UNIQUE,
      alertcode text, alertha numeric, source text, detectat text, detectyear int, state text, stateha numeric, geom geometry(Polygon,4674));
    CREATE TABLE monitoramento.firms_regioes (firm_id uuid REFERENCES monitoramento.raw_firms(id),
      regiao_id int REFERENCES monitoramento.regioes(id), UNIQUE(firm_id,regiao_id));
    CREATE TABLE monitoramento.desmatamento_regioes (desmatamento_id int REFERENCES monitoramento.desmatamento(id),
      regiao_id int REFERENCES monitoramento.regioes(id), UNIQUE(desmatamento_id,regiao_id));
    CREATE TABLE monitoramento.propriedades (id int PRIMARY KEY, tenant_id uuid, cod_tema text, nom_tema text,
      cod_imovel text, mod_fiscal numeric, num_area numeric, ind_status text, ind_tipo text,
      des_condic text, municipio text, geom geometry(Polygon,4674));`);
  await pool.query(`INSERT INTO monitoramento.regioes VALUES
    (11,$1,ST_MakeEnvelope(0,0,2,2,4674)),
    (12,$1,ST_MakeEnvelope(3,3,5,5,4674)),
    (21,$2,ST_MakeEnvelope(0,0,2,2,4674)),
    (22,$2,ST_MakeEnvelope(6,6,8,8,4674));
    `, [A,B]);
  await pool.query(`INSERT INTO monitoramento.user_access(user_id,organization_id,regiao_id) VALUES
    ($1,$3,11),($2,$4,21);`, [REVOKED,ASSIGNED,A,B]);
  await pool.query(`INSERT INTO monitoramento.roles(user_id,tenant_id,role,region_id) VALUES
    ($1,$2,'viewer',12);`, [ASSIGNED,A]);
  await pool.query(`INSERT INTO monitoramento.acoes(id,tenant_id,regiao_id,geom) VALUES
    (1,$1,11,ST_SetSRID(ST_Point(1,1),4674)),
    (2,$2,21,ST_SetSRID(ST_Point(1,1),4674)),
    (3,$1,12,ST_SetSRID(ST_Point(4,4),4674));`, [A,B]);
  await pool.query(`INSERT INTO monitoramento.estradas(id,tenant_id,regiao_id,geom) VALUES
    (1,$1,11,ST_MakeLine(ST_SetSRID(ST_Point(0,0),4674),ST_SetSRID(ST_Point(1,1),4674))),
    (2,$2,21,ST_MakeLine(ST_SetSRID(ST_Point(0,0),4674),ST_SetSRID(ST_Point(1,1),4674)));`, [A,B]);
  await pool.query(`INSERT INTO monitoramento.raw_firms(id,acq_date,geom) VALUES
    ($1,'2026-10-04',ST_SetSRID(ST_Point(1,1),4674)),
    ($2,'2026-10-04',ST_SetSRID(ST_Point(7,7),4674));`, [F,G]);
  await pool.query(`INSERT INTO monitoramento.firms_regioes VALUES ($1,11),($1,12),($1,21),($2,22);`,[F,G]);
  await pool.query(`INSERT INTO monitoramento.desmatamento(id,alertid,alertha,detectat,geom) VALUES
    (1,'shared',10,'2026-10-04',ST_MakeEnvelope(.5,.5,1.5,1.5,4674)),
    (2,'private-b-region',20,'2026-10-04',ST_MakeEnvelope(6.5,6.5,7.5,7.5,4674));
    INSERT INTO monitoramento.desmatamento_regioes VALUES (1,11),(1,12),(1,21),(2,22);`);
  await pool.query(`INSERT INTO monitoramento.propriedades(id,tenant_id,cod_imovel,geom) VALUES
    (1,$1,'universal',ST_MakeEnvelope(.5,.5,1.5,1.5,4674)),
    (2,$2,'b-only',ST_MakeEnvelope(6.5,6.5,7.5,7.5,4674));`,[B,A]);
},30000);
afterAll(async () => { await pool.end(); });
async function ids(tableName: string, tenantId: string, regiaoId?: number, scope: LayerScope = 'global') {
  const result = await resolveTableLayer({tableName},scope,{tenantId,regiaoId});
  return result.features.map(f=>f.id);
}
test.each(['tenant','region','global'] as LayerScope[])('actions remain organization private with overlapping geometry and catalog %s', async scope => {
  expect(await ids('acoes',A,11,scope)).toEqual([1]);
  expect(await ids('acoes',B,21,scope)).toEqual([2]);
  expect(await ids('acoes',A,21,scope)).toEqual([]);
  expect((await ids('acoes',A,undefined,scope)).sort()).toEqual([1,3]);
});
test.each(['raw_firms','desmatamento'])('%s shares one physical fact across organizations without exposing unrelated facts',async table=> {
  const shared = table === 'raw_firms' ? F : 1;
  expect(await ids(table,A,11)).toEqual([shared]);
  expect(await ids(table,B,21)).toEqual([shared]);
  expect(await ids(table,A,22)).toEqual([]);
  expect(await ids(table,A)).toEqual([shared]);
});
it('FIRMS indicator input counts one fact despite two authorized region links',async()=> {
  expect((await findAllFirmsData(A,false,[11,12])).rows.map((r:any)=>r.id)).toEqual([F]);
  expect((await findAllFirmsData(A,false,[])).rows).toEqual([]);
});
it('desmatamento indicator input counts ten hectares once across overlapping links',async()=> {
  const rows=await findAllDesmatamentoData(A,false,[11,12]);
  expect(rows).toHaveLength(1);
  expect(rows.reduce((sum,r)=>sum+Number(r.alertha),0)).toBe(10);
  expect(await findAllDesmatamentoData(A,false,[])).toEqual([]);
});
it('properties follow owned spatial regions even when legacy tenant points elsewhere',async()=> {
  expect(await ids('propriedades',A,11)).toEqual([1]);
  expect(await ids('propriedades',B,21)).toEqual([1]);
  expect(await ids('propriedades',A,22)).toEqual([]);
  expect(await ids('propriedades',A)).toEqual([1]);
});
test.each(['tenant','region','global'] as LayerScope[])('roads remain private with overlapping geometry and catalog %s', async scope => {
  expect(await ids('estradas',A,11,scope)).toEqual([1]);
  expect(await ids('estradas',B,21,scope)).toEqual([2]);
  expect(await ids('estradas',A,21,scope)).toEqual([]);
});
it('property count uses the assigned regions rather than the legacy tenant column', async()=> {
  expect(await countPropriedades(A,undefined,undefined,[11])).toBe(1);
  expect(await countPropriedades(A,undefined,undefined,[])).toBe(0);
  expect(await countPropriedades(B,undefined,undefined,[21,22])).toBe(2);
});
it('revoked legacy associations cannot restore organization or regional access', async()=> {
  const user = { id: REVOKED, app_metadata: { tenant_id: A } } as any;
  expect(await resolveTenantIdForUser(user)).toBeNull();
  expect(await getAccessibleRegionIdsForUser(REVOKED,A)).toEqual([]);
});
it('current roles override stale legacy regional and organization entries', async()=> {
  const user = { id: ASSIGNED, app_metadata: { tenant_id: B } } as any;
  expect(await resolveTenantIdForUser(user)).toBe(A);
  expect(await getAccessibleRegionIdsForUser(ASSIGNED,A)).toEqual([12]);
});
