// All inference happens in this browser worker; story text is never put in a request.
import { embeddingText, rankVectors } from './core.js';
const MODEL = 'Xenova/all-MiniLM-L6-v2';
const REVISION = '751bff37182d3f1213fa05d7196b954e230abad9';
let extractor, loading, indexedKey='', vectors=[];
async function load() {
  if(extractor) return extractor;
  if(loading) return loading;
  loading = (async()=>{
    const {pipeline, env} = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js');
    env.allowLocalModels=false;
    env.allowRemoteModels=true;
    env.useBrowserCache=true;
    env.backends.onnx.wasm.numThreads=1;
    env.backends.onnx.wasm.proxy=false;
    extractor=await pipeline('feature-extraction',MODEL,{revision:REVISION,dtype:'q8',device:'wasm',progress_callback:p=>{
      self.postMessage({type:'progress',file:p.file||'',status:p.status||'',progress:Number.isFinite(p.progress)?p.progress:null});
    }});
    const check=await extractor('A memory kept with care.',{pooling:'mean',normalize:true});
    if(check.dims[1]!==384 || !check.tolist()[0].every(Number.isFinite)) throw new Error('The model returned an unexpected embedding.');
    self.postMessage({type:'ready',model:MODEL,dimensions:384,runtime:'Transformers.js 3.8.1 · ONNX WASM · q8'});
    return extractor;
  })();
  return loading;
}
let queue=Promise.resolve();
async function handle(data) {
  try {
    if(data.type==='load') { await load(); return; }
    if(data.type==='search') {
      const pipe=await load();
      const key=JSON.stringify(data.cards.map(c=>[c.id,c.title,c.text]));
      if(key!==indexedKey) {
        const next=[];
        for(let i=0;i<data.cards.length;i+=8) {
          const out=await pipe(data.cards.slice(i,i+8).map(embeddingText),{pooling:'mean',normalize:true});
          next.push(...out.tolist());
          self.postMessage({type:'indexing',id:data.id,done:Math.min(i+8,data.cards.length),total:data.cards.length});
        }
        vectors=next; indexedKey=key;
      }
      const requestVectors=vectors;
      const q=await pipe(data.query,{pooling:'mean',normalize:true});
      self.postMessage({type:'results',id:data.id,matches:rankVectors(data.cards,requestVectors,q.tolist()[0]),dimensions:q.dims[1],indexedCount:requestVectors.length});
    }
  } catch(error) {
    self.postMessage({type:'error',id:data.id??null,message:String(error?.message||error).slice(0,260)});
    if(!extractor) loading=null;
  }
}
self.onmessage=({data})=>{ queue=queue.then(()=>handle(data)).catch(error=>self.postMessage({type:'error',id:data.id??null,message:String(error?.message||error).slice(0,260)})); };
