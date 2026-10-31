import { SAMPLE_CARDS, validateArchive, citationText, keywordSearch } from './core.js';
const $ = id => document.getElementById(id);
const cloneDemo = () => SAMPLE_CARDS.map(card=>({...card}));
const STORAGE='echoes-with-evidence-v1', PREF='echoes-with-evidence-remember';
let cards=cloneDemo(), worker=null, aiState='unloaded', sequence=0, activeSearch=null, loadTimer=null, searchTimer=null, currentDetail=null;
const icons={
 radio:'<rect x="9" y="21" width="46" height="32" rx="4"/><path d="M39 20 47 7M16 15h15M15 35h16M15 40h16M15 45h16"/><circle cx="44" cy="36" r="5"/><circle cx="44" cy="46" r="2"/>',
 orange:'<circle cx="30" cy="36" r="19"/><path d="M30 17q-1-10 9-11M31 15q12 0 15-7-13-1-15 7M22 24q-8 9-5 16M47 42q13 4 4 12-11 7-22 1"/>',
 bicycle:'<circle cx="16" cy="43" r="11"/><circle cx="49" cy="43" r="11"/><path d="m16 43 10-20 11 20H16l19-16 14 16-9-25h-6M21 23h11M37 14h8"/>',
 letter:'<rect x="9" y="20" width="46" height="31" rx="2"/><path d="m10 22 22 16 22-16M10 49l15-13m29 13L39 36M23 12h19M29 7h15"/>',
 flower:'<path d="M32 41v17M32 52q-15-2-15-11 13-1 15 11M32 49q13-1 15-11-13 0-15 11"/><circle cx="32" cy="27" r="6"/><path d="M28 21q-11-17 4-17t4 17q17-11 17 4t-17 6q11 17-4 17t-4-17q-17 11-17-4t17-6Z"/>',
 thread:'<path d="M20 21h23v28H20zM23 21l-5-7h27l-5 7M23 49l-5 5h27l-5-5M20 27l23 7-23 7 23 4M44 37q17 1 10 13-5 7-1 10M14 13 10 4"/>',
 shell:'<path d="M12 39q-1-26 20-26t20 26L37 54H27L12 39ZM32 14v39M22 17l6 36m15-36-7 36M13 29l15 22m24-22L36 51M25 57h14"/>',
 star:'<path d="m32 8 6 16 17 1-13 11 4 17-14-9-14 9 4-17L9 25l17-1 6-16ZM9 8v6M6 11h6m43 37v8m-4-4h8M15 59h8"/>'
};
function element(tag,cls,text){const node=document.createElement(tag); if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;}
function notify(text){$('notice').textContent=text;}
function persist(){
  try{
    if($('rememberArchive').checked){localStorage.setItem(STORAGE,JSON.stringify({version:1,cards}));localStorage.setItem(PREF,'yes');$('storageStatus').textContent='Remembering this archive in this browser profile. Export is still your backup.';}
    else {localStorage.removeItem(STORAGE);localStorage.removeItem(PREF);$('storageStatus').textContent='Tab-only mode. Export a JSON copy to keep your edits.';}
  }catch{ $('storageStatus').textContent='Browser storage is unavailable. Your cards still work in this tab; export to keep them.'; }
}
try { if(localStorage.getItem(PREF)==='yes'){const saved=localStorage.getItem(STORAGE);if(saved){cards=validateArchive(JSON.parse(saved));$('rememberArchive').checked=true;$('storageStatus').textContent='Restored the archive saved in this browser profile.';}} } catch { $('storageStatus').textContent='Saved archive could not be read. Showing the fictional demo; export your work to keep it.'; }
function cancelSearch(){clearTimeout(searchTimer);sequence++;activeSearch=null;$('searchButton').disabled=false;$('searchButton').textContent='Find the echoes →';$('resultsSection').hidden=true;$('results').replaceChildren();$('resultsNote').textContent='';delete $('resultsSection').dataset.query;delete $('resultsSection').dataset.indexedCount;delete $('resultsSection').dataset.dimensions;delete $('resultsSection').dataset.matchStrength;delete $('resultsSection').dataset.searchMode;}
function archiveChanged(message){cancelSearch();currentDetail=null;for(const id of ['detailTitle','detailText','detailMeta','detailSource','editorError'])$(id).textContent='';$('memoryForm').reset();$('memoryId').value='';renderCards();persist();notify(message);}
function renderCards(){
  const grid=$('memoryGrid');grid.replaceChildren();$('cardCount').textContent=String(cards.length).padStart(2,'0');$('emptyArchive').hidden=cards.length>0;
  cards.forEach((card,i)=>{
    const button=element('button',`memory-card ${card.color}`);button.type='button';button.dataset.cardId=card.id;button.setAttribute('aria-label',`Read ${card.title}, ${card.person}, ${card.year}${card.fictional?', fictional story':''}`);
    const top=element('div','card-top');top.append(element('span','',card.year),element('span','card-number',String(i+1).padStart(2,'0')));
    const art=element('div','card-art');art.setAttribute('aria-hidden','true');art.innerHTML=`<svg viewBox="0 0 64 64">${icons[card.symbol]||icons.flower}</svg>`;
    const bottom=element('div','card-bottom');bottom.append(element('span','',card.person),element('b','',card.fictional?'FICTIONAL STORY':'YOUR ARCHIVE'));
    button.append(top,art,element('h3','',card.title),bottom);button.addEventListener('click',()=>showDetail(card.id));grid.append(button);
  });
}
function showDetail(id){const c=cards.find(x=>x.id===id);if(!c)return;currentDetail=id;$('detailMeta').textContent=`${c.person} / ${c.year}${c.fictional?' / FICTIONAL STORY':''}`;$('detailTitle').textContent=c.title;$('detailText').textContent=c.text;$('detailSource').textContent='Source: the exact words saved on this memory card. No AI-generated text.';$('detailDialog').showModal();}
function openEditor(id=null){
 const c=cards.find(x=>x.id===id);if(!c&&cards.length>=100){notify('The table holds up to 100 memories. Export or remove a card before adding another.');return;}
 $('memoryForm').reset();$('editorError').textContent='';$('memoryId').value=c?.id||'';$('memoryTitle').value=c?.title||'';$('memoryPerson').value=c?.person||'';$('memoryYear').value=c?.year||'';$('memoryText').value=c?.text||'';$('memoryFictional').checked=c?.fictional||false;$('deleteCard').hidden=!c;$('editorTitle').textContent=c?'A story, kept with care.':'Keep a small story.';$('editorEyebrow').textContent=c?'EDIT A MEMORY':'ADD TO THE TABLE';$('memoryDialog').showModal();
}
$('memoryForm').addEventListener('submit',e=>{
 e.preventDefault();const old=cards.find(c=>c.id===$('memoryId').value);const card={id:old?.id||`memory-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`,title:$('memoryTitle').value,person:$('memoryPerson').value,year:$('memoryYear').value,text:$('memoryText').value,fictional:$('memoryFictional').checked,symbol:old?.symbol||'flower',color:old?.color||['ochre','rose','teal','plum'][cards.length%4]};
 try{const valid=validateArchive({version:1,cards:[card]})[0];cards=old?cards.map(c=>c.id===old.id?valid:c):[...cards,valid];$('memoryDialog').close();archiveChanged('Memory kept. Future searches use your updated words.');}catch(error){$('editorError').textContent=error.message;}
});
$('deleteCard').addEventListener('click',()=>{const id=$('memoryId').value;if(confirm('Delete this memory from this archive? Exported copies will not change.')){cards=cards.filter(c=>c.id!==id);$('memoryDialog').close();archiveChanged('Memory removed from this archive.');}});
$('editDetail').addEventListener('click',()=>{$('detailDialog').close();openEditor(currentDetail);});
$('addCard').addEventListener('click',()=>openEditor());
document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));
for(const [id,title]of [['memoryDialog','editorTitle'],['detailDialog','detailTitle'],['aboutDialog','aboutTitle'],['creditsDialog','creditsTitle']]){const dialog=$(id);const heading=dialog.querySelector('h2');heading.id=title;dialog.setAttribute('aria-labelledby',title);}
for(const [button,dialog]of [['aboutButton','aboutDialog'],['creditsButton','creditsDialog']])$(button).addEventListener('click',()=>$(dialog).showModal());
$('rememberArchive').addEventListener('change',persist);
$('exportArchive').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({version:1,exportedAt:new Date().toISOString(),cards},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='echoes-archive.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Archive exported. Keep this file somewhere you trust.');});
$('importArchive').addEventListener('click',()=>$('importFile').click());
$('importFile').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>1024*1024)throw new Error('Please use a JSON archive smaller than 1 MB.');const imported=validateArchive(JSON.parse(await file.text()));if(!confirm(`Replace this table with ${imported.length} imported memories? Export this archive first if you want a copy.`))return;cards=imported;archiveChanged('Archive imported locally. Nothing was uploaded.');}catch(error){notify(`Import stopped: ${error.message}`);}finally{e.target.value='';}});
$('wipeArchive').addEventListener('click',()=>{
 if(confirm('Clear every memory from this table and any archive saved by this app in this browser? Exported files and downloaded model cache will remain.')){
  cards=[];$('search').value='';clearTimeout(loadTimer);worker?.terminate();worker=null;aiState='unloaded';
  $('aiBox').dataset.aiState='unloaded';delete $('aiBox').dataset.dimensions;$('aiTitle').textContent='The archive and local AI session are clear.';$('aiStatus').textContent='Load local AI again when needed. Keyword matching is available (NOT AI).';$('loadAi').disabled=false;$('loadAi').textContent='Load local AI ↓';$('loadProgress').hidden=true;$('searchMode').value='keyword';$('searchMode').querySelector('[value=semantic]').disabled=true;$('modelEvidence').textContent='Local AI session cleared. Downloaded browser cache may remain.';
  archiveChanged('The memory table and AI worker are clear. Exported copies and model files are unchanged.');
 }
});
$('restoreDemo').addEventListener('click',()=>{if(confirm('Replace this table with the eight fictional demo memories? Export your current archive first to keep it.')){cards=cloneDemo();archiveChanged('The eight fictional demo stories are back on the table.');}});
function aiFailed(message){clearTimeout(loadTimer);worker?.terminate();worker=null;aiState='error';$('aiBox').dataset.aiState='error';$('aiTitle').textContent='Local AI could not load.';$('aiStatus').textContent=`${message} Keyword matching is still available (NOT AI).`;$('loadAi').disabled=false;$('loadAi').textContent='Retry local AI ↓';$('loadProgress').hidden=true;$('searchMode').querySelector('[value=semantic]').disabled=true;$('searchMode').value='keyword';$('modelEvidence').textContent='AI unavailable. Keyword mode is explicitly marked.';cancelSearch();}
function loadAi(){
 if(aiState==='loading'||aiState==='ready')return;
 aiState='loading';$('aiBox').dataset.aiState='loading';$('aiTitle').textContent='Bringing a small model to your device…';$('aiStatus').textContent='Downloading the library, tokenizer, model and browser runtime. Your stories are not part of these requests.';$('loadAi').disabled=true;$('loadAi').textContent='Loading…';$('loadProgress').hidden=false;$('loadProgress').removeAttribute('value');
 try{const instance=new Worker(new URL('./ai-worker.js',import.meta.url),{type:'module'});worker=instance;instance.onmessage=e=>{if(worker===instance)onWorkerMessage(e);};instance.onerror=e=>{e.preventDefault();if(worker===instance)aiFailed('The browser blocked the model worker or one of its download files.');};instance.postMessage({type:'load'});loadTimer=setTimeout(()=>aiFailed('The model took too long to load. Check your connection and try again.'),180000);}catch(error){aiFailed(String(error.message));}
}
function onWorkerMessage({data}){
 if(data.type==='progress'&&aiState==='loading'){
  const file=data.file.split('/').pop();$('aiStatus').textContent=`Loading ${file||'browser AI runtime'}${data.progress!==null?` · ${Math.round(data.progress)}%`:''}. Story text stays on this device.`;
  if(data.progress!==null)$('loadProgress').value=data.progress;else $('loadProgress').removeAttribute('value');
 }else if(data.type==='ready'){
  clearTimeout(loadTimer);aiState='ready';$('aiBox').dataset.aiState='ready';$('aiBox').dataset.dimensions=String(data.dimensions);$('aiTitle').textContent='Local AI is ready. The stories stay here.';$('aiStatus').textContent='Real model loaded and verified: 384-dimensional embeddings. Search runs locally; similarity can be imperfect.';$('loadProgress').hidden=true;$('loadAi').textContent='Local AI ready ✓';$('loadAi').disabled=true;$('searchMode').querySelector('[value=semantic]').disabled=false;$('searchMode').value='semantic';$('modelEvidence').textContent=`${data.runtime} · 384 dimensions`;
 }else if(data.type==='indexing'&&activeSearch?.id===data.id){$('resultsNote').textContent=`Reading your archive locally: ${data.done} of ${data.total} memories embedded…`;
 }else if(data.type==='results'&&activeSearch?.id===data.id){renderResults(data.matches,'semantic',activeSearch.query,{dimensions:data.dimensions,indexedCount:data.indexedCount});activeSearch=null;
 }else if(data.type==='error'){
  if(data.id!==null&&activeSearch?.id!==data.id)return;
  if(aiState==='loading')aiFailed('A required model file could not be downloaded or run.');else {cancelSearch();$('aiStatus').textContent='Local AI search failed. Try a shorter query, or select keyword matching (NOT AI).';notify('Search could not complete. No generated results were substituted.');}
 }
}
function renderResults(matches,mode,query,evidence={}){
 clearTimeout(searchTimer);
 const section=$('resultsSection');section.hidden=false;section.dataset.searchMode=mode;section.dataset.query=query;section.dataset.dimensions=String(evidence.dimensions||0);section.dataset.indexedCount=String(evidence.indexedCount||0);$('resultMethod').textContent=mode==='semantic'?'LOCAL AI · SEMANTIC SIMILARITY':'KEYWORD MATCHING · NOT AI';$('resultsTitle').textContent=matches.length?'The threads we found':'No thread found yet';$('resultsNote').textContent=mode==='semantic'?`Closest sources for “${query}”. These are ranked connections, not verified answers. Even unrelated queries may have a nearest match.`:`Exact word matches for “${query}”. This method is NOT AI and does not understand meaning.`;
 if(mode==='semantic'&&matches.length&&matches[0].score<0.25){$('resultsTitle').textContent='No strong thread yet';$('resultsNote').textContent=`Low similarity for “${query}”. The sources below are only the nearest available; they may be unrelated. Try another query. The 0.25 warning is a design heuristic, not a calibrated confidence threshold.`;section.dataset.matchStrength='weak';}else{section.dataset.matchStrength=mode==='semantic'?'ranked':'keyword';}
 const out=$('results');out.replaceChildren();
 if(!matches.length)out.append(element('p','empty-state',cards.length?'Try different words, or load local AI to search by meaning.':'Add a memory before searching your table.'));
 matches.forEach((match,i)=>{const card=cards.find(c=>c.id===match.id);if(!card)return;const article=element('article','result-card');article.dataset.cardId=card.id;article.dataset.score=String(match.score);const body=element('div','result-body'),top=element('div','result-top');top.append(element('h3','',card.title),element('span','result-score',mode==='semantic'?`COSINE ${match.score.toFixed(3)}`:`${match.score} WORD MATCH${match.score===1?'':'ES'}`));const quote=element('blockquote','',citationText(card));const source=element('p','result-source');source.append(document.createTextNode(`${card.person} · ${card.year}${card.fictional?' · Fictional story':''} · `));const link=element('button','',card.text.length>420?'Read full source →':'Open source card →');link.type='button';link.addEventListener('click',()=>showDetail(card.id));source.append(link);body.append(top,quote,source);article.append(element('div','result-number',String(i+1).padStart(2,'0')),body);out.append(article);});
 $('searchButton').disabled=false;$('searchButton').textContent='Find the echoes →';
}
function search(){
 const query=$('search').value.trim();if(!query){$('search').focus();return;}if(query.length>500){notify('Please keep your search under 500 characters.');return;}
 clearTimeout(searchTimer);const id=++sequence;activeSearch={id,query};
 if($('searchMode').value==='semantic'&&aiState==='ready'){
  $('searchButton').disabled=true;$('searchButton').textContent='Following the thread…';$('resultsSection').hidden=false;$('resultsSection').dataset.searchMode='pending';$('resultMethod').textContent='LOCAL AI · WORKING ON THIS DEVICE';$('resultsTitle').textContent='Following the thread…';$('results').replaceChildren();$('resultsNote').textContent='Embedding your query and comparing the words saved in your archive.';
  worker.postMessage({type:'search',id,query,cards});searchTimer=setTimeout(()=>{if(activeSearch?.id===id)aiFailed('The search took too long on this device. Try a smaller archive or load the model again.');},90000);
 }else{renderResults(keywordSearch(cards,query),'keyword',query);activeSearch=null;}
}
$('loadAi').addEventListener('click',loadAi);
$('searchForm').addEventListener('submit',e=>{e.preventDefault();search();});
document.querySelectorAll('[data-query]').forEach(button=>button.addEventListener('click',()=>{$('search').value=button.dataset.query;search();}));
$('clearSearch').addEventListener('click',()=>{cancelSearch();$('search').focus();});
$('searchMode').addEventListener('change',()=>{cancelSearch();if($('search').value.trim())search();});
renderCards();
