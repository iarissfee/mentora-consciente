'use strict';

function requiredReplace(source, from, to, label) {
  if (!source.includes(from)) throw new Error(`No se pudo aplicar parche: ${label}`);
  return source.replace(from, to);
}

function patchSource(source) {
  source = requiredReplace(
    source,
    "const { DatabaseSync } = require('node:sqlite');",
    "const { DatabaseSync } = require('node:sqlite');\nlet Pool = null;",
    'import pg'
  );

  source = requiredReplace(
    source,
    "const DATA_DIR = path.join(ROOT,'data');\nconst UPLOAD_DIR = path.join(ROOT,'private_uploads');",
    "const DATA_DIR = path.join(ROOT,'data');\nconst UPLOAD_DIR = path.join(ROOT,'private_uploads');\nconst DB_FILE = path.join(DATA_DIR,'campus.db');",
    'DB_FILE'
  );

  source = requiredReplace(
    source,
    "const db = new DatabaseSync(path.join(DATA_DIR,'campus.db'));\ndb.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');",
    `let db;
let remotePool = null;
let persistQueue = Promise.resolve();

async function initRemoteStore(){
  const url=process.env.DATABASE_URL;
  if(!url)return;
  if(!Pool)({Pool}=require('pg'));
  const ssl=/localhost|127\\.0\\.0\\.1/.test(url)?false:{rejectUnauthorized:false};
  remotePool=new Pool({connectionString:url,ssl,max:3,idleTimeoutMillis:30000});
  await remotePool.query(\`CREATE TABLE IF NOT EXISTS mc_runtime_state (id SMALLINT PRIMARY KEY CHECK(id=1), sqlite_blob BYTEA NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())\`);
  await remotePool.query(\`CREATE TABLE IF NOT EXISTS mc_asset_blobs (stored_name TEXT PRIMARY KEY, data BYTEA NOT NULL, mime TEXT NOT NULL DEFAULT 'application/pdf', bytes INTEGER NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())\`);
  const r=await remotePool.query('SELECT sqlite_blob FROM mc_runtime_state WHERE id=1');
  if(r.rows[0]?.sqlite_blob){
    for(const suffix of ['','-wal','-shm']){const fp=DB_FILE+suffix;if(fs.existsSync(fp))fs.unlinkSync(fp)}
    fs.writeFileSync(DB_FILE,r.rows[0].sqlite_blob,{mode:0o600});
  }
  const assets=await remotePool.query('SELECT stored_name,data FROM mc_asset_blobs');
  for(const row of assets.rows){
    const safe=path.basename(row.stored_name);
    if(safe!==row.stored_name)continue;
    fs.writeFileSync(path.join(UPLOAD_DIR,safe),row.data,{mode:0o600});
  }
}

async function syncAssetsToRemote(){
  if(!remotePool)return;
  const local=fs.readdirSync(UPLOAD_DIR).filter(n=>n.endsWith('.pdf'));
  const rr=await remotePool.query('SELECT stored_name,bytes FROM mc_asset_blobs');
  const remote=new Map(rr.rows.map(r=>[r.stored_name,Number(r.bytes)]));
  for(const name of local){
    const fp=path.join(UPLOAD_DIR,name),st=fs.statSync(fp);
    if(remote.get(name)===st.size)continue;
    const data=fs.readFileSync(fp);
    await remotePool.query(\`INSERT INTO mc_asset_blobs(stored_name,data,mime,bytes,updated_at) VALUES($1,$2,'application/pdf',$3,NOW()) ON CONFLICT(stored_name) DO UPDATE SET data=EXCLUDED.data,bytes=EXCLUDED.bytes,updated_at=NOW()\`,[name,data,data.length]);
  }
  const keep=new Set(local);
  for(const name of remote.keys())if(!keep.has(name))await remotePool.query('DELETE FROM mc_asset_blobs WHERE stored_name=$1',[name]);
}

async function persistState(includeAssets=false){
  if(!remotePool||!db)return;
  persistQueue=persistQueue.then(async()=>{
    db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
    const blob=fs.readFileSync(DB_FILE);
    await remotePool.query(\`INSERT INTO mc_runtime_state(id,sqlite_blob,updated_at) VALUES(1,$1,NOW()) ON CONFLICT(id) DO UPDATE SET sqlite_blob=EXCLUDED.sqlite_blob,updated_at=NOW()\`,[blob]);
    if(includeAssets)await syncAssetsToRemote();
  }).catch(e=>console.error('Persistencia PostgreSQL:',e));
  await persistQueue;
}`,
    'persistencia remota'
  );

  source = requiredReplace(source, "}\ninitDb();\n\nconst rates", "}\n\nconst rates", 'init diferido');

  const csrfLine = "route('GET','/api/csrf',async(req,res)=>json(res,200,{token:csrfToken(req,res)}));";
  source = requiredReplace(
    source,
    csrfLine,
    "route('GET','/api/health',async(req,res)=>json(res,200,{ok:true,storage:remotePool?'postgres':'local'}));\n" + csrfLine,
    'health check'
  );

  source = requiredReplace(
    source,
    "return await r.handler(req,res,params,u)}if(req.method==='GET'||req.method==='HEAD')",
    "const out=await r.handler(req,res,params,u);if(['POST','PUT','PATCH','DELETE'].includes(req.method))await persistState(pathname.startsWith('/api/admin/'));return out}if(req.method==='GET'||req.method==='HEAD')",
    'persistencia por request'
  );

  source = requiredReplace(
    source,
    "server.listen(PORT,()=>console.log(`Campus listo en http://localhost:${PORT}`));",
    `async function bootstrap(){
  await initRemoteStore();
  db=new DatabaseSync(DB_FILE);
  db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');
  initDb();
  await persistState(true);
  server.listen(PORT,()=>console.log(\`Campus listo en http://localhost:\${PORT}\${remotePool?' + PostgreSQL persistente':''}\`));
}
async function shutdown(){try{await persistState(true);if(remotePool)await remotePool.end()}catch(e){console.error('Cierre persistente:',e)}finally{process.exit(0)}}
process.once('SIGTERM',shutdown);process.once('SIGINT',shutdown);
bootstrap().catch(e=>{console.error('No se pudo iniciar el campus:',e);process.exit(1)});`,
    'bootstrap'
  );

  return source;
}

module.exports = { patchSource };
