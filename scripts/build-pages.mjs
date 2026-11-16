import { rename, mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
// GitHub Pages cannot execute API routes. Temporarily exclude the optional server endpoint.
await mkdir('.build-support',{recursive:true});
let result;
try {
  await rename('app/api','.build-support/api');
  result=spawnSync(process.execPath,['node_modules/next/dist/bin/next','build','--webpack'],{stdio:'inherit',env:{...process.env,STATIC_EXPORT:'1',NEXT_PUBLIC_STATIC_DEMO:'1'}});
  if(result.status===0) await writeFile('out/.nojekyll','');
} finally { await rename('.build-support/api','app/api'); }
process.exit(result?.status??1);
