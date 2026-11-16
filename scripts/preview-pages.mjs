import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root=resolve('out'),base=process.env.NEXT_PUBLIC_BASE_PATH??'/cbs-startup-bd',port=Number(process.env.PORT||3000);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.txt':'text/plain; charset=utf-8','.svg':'image/svg+xml','.ico':'image/x-icon','.woff2':'font/woff2'};
createServer(async(req,res)=>{
  try {
    const url=new URL(req.url,'http://localhost');
    if(url.pathname==='/'&&base){res.writeHead(302,{Location:`${base}/`});res.end();return;}
    if(base&&url.pathname!==base&&!url.pathname.startsWith(`${base}/`)){res.writeHead(404);res.end('Not found');return;}
    let path=resolve(root,'.'+decodeURIComponent(url.pathname.slice(base.length)||'/'));
    if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403);res.end();return;}
    if((await stat(path)).isDirectory())path=resolve(path,'index.html');
    const data=await readFile(path);res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
  }catch{res.writeHead(404);res.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Static Pages preview: http://127.0.0.1:${port}${base}/`));
