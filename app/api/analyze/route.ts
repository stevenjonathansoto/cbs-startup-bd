import { analyze } from '@/server/ai';
export const runtime='nodejs';
export async function POST(request:Request) {
  try {
    if(Number(request.headers.get('content-length')||0)>50000) return Response.json({error:'Request too large.'},{status:413});
    const result=await analyze(await request.json());
    return Response.json(result);
  } catch(error) {
    console.error('Analysis failed:',error instanceof Error?error.name:'Unknown error');
    return Response.json({error:'Analysis could not be completed or did not pass evidence validation. Your work is preserved. Retry, or select deterministic demo mode.'},{status:422});
  }
}
