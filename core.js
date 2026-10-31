// Original application code, created 31 October 2026 with AI assistance.
export const SAMPLE_CARDS = [
  { id:'rain-radio', title:'The radio in the rain', year:'1978', person:'Mara', symbol:'radio', color:'plum', fictional:true, text:'When the storm cut the electricity, Mara carried a little battery radio to the kitchen. She tuned it until a waltz emerged through the static. We danced in our socks while rain tapped the dark windows. She said a room could still be warm without a single light.' },
  { id:'orange-peel', title:'A map made of orange peel', year:'1986', person:'Elian', symbol:'orange', color:'ochre', fictional:true, text:'Every Sunday Elian peeled an orange in one long spiral at the kitchen table. He laid the peel beside a flour-dusted recipe book and called it a tiny road home. The marmalade simmered for hours. I remember the citrus scent, the sticky wooden spoon, and his patient hands.' },
  { id:'blue-bicycle', title:'The blue bicycle lesson', year:'1992', person:'Nia', symbol:'bicycle', color:'teal', fictional:true, text:'Nia taught me to ride a blue bicycle in the empty schoolyard. I was certain I would fall. She ran beside me with one hand on the saddle, then let go without announcing it. At the far gate I turned and saw her cheering, small and bright in a yellow raincoat.' },
  { id:'station-letter', title:'A letter for the long way', year:'1964', person:'Tomas', symbol:'letter', color:'rose', fictional:true, text:'Before Tomas left by train, he tucked a handwritten letter into the lining of his suitcase. The letter held the address of his childhood home and a pressed purple flower. He read it at each unfamiliar station. The paper became soft at the folds, but the ink stayed clear.' },
  { id:'garden-seeds', title:'What the garden kept', year:'2001', person:'Ada', symbol:'flower', color:'ochre', fictional:true, text:'Ada saved marigold seeds in old paper envelopes above the garden shed. Each envelope carried a date and a crooked drawing of the flower. In spring she gave the seeds to neighbors, asking them to bring back a story instead of money. By summer the entire lane glowed orange.' },
  { id:'red-scarf', title:'The unfinished red scarf', year:'1981', person:'Ivo', symbol:'thread', color:'rose', fictional:true, text:'Ivo knitted a red wool scarf on winter evenings. He dropped stitches, laughed, and unpicked whole rows instead of hiding the mistakes. The scarf was still unfinished when the snow melted. He wrapped it around the old apple tree, saying even a tree deserved something soft.' },
  { id:'sea-glass', title:'A pocket full of sea glass', year:'1997', person:'Luz', symbol:'shell', color:'teal', fictional:true, text:'Luz searched the beach for green sea glass at dawn. She never took shells with living creatures inside. At home she arranged the glass on the windowsill, where sunlight made little green islands on the floor. She called each smooth edge a lesson in taking your time.' },
  { id:'rooftop-stars', title:'The rooftop constellation', year:'1973', person:'Ren', symbol:'star', color:'plum', fictional:true, text:'Ren brought a patched blanket to the rooftop on clear nights. With a red pencil and a folded star chart, he showed us the constellations above the city. We could not see every star through the streetlights. He left the missing ones blank on our drawing rather than guessing.' }
];

export function validateArchive(input) {
  if (!input || input.version !== 1 || !Array.isArray(input.cards)) throw new Error('Choose an Echoes archive JSON with version 1 and a cards array.');
  if (input.cards.length > 100) throw new Error('This small archive supports up to 100 memory cards.');
  const seen = new Set();
  return input.cards.map((card, i) => {
    if (!card || typeof card !== 'object') throw new Error(`Card ${i+1} is invalid.`);
    for (const [key, max] of [['id',80],['title',100],['person',80],['year',30],['text',3000]]) {
      if (typeof card[key] !== 'string' || !card[key].trim() || card[key].length > max) throw new Error(`Card ${i+1}: ${key} is missing or too long.`);
    }
    if (seen.has(card.id)) throw new Error('Each memory needs a unique id.');
    seen.add(card.id);
    return { id:card.id, title:card.title.trim(), person:card.person.trim(), year:card.year.trim(), text:card.text.trim(), fictional:card.fictional === true, symbol:['radio','orange','bicycle','letter','flower','thread','shell','star'].includes(card.symbol) ? card.symbol : 'flower', color:['plum','ochre','teal','rose'].includes(card.color) ? card.color : 'ochre' };
  });
}

export const embeddingText = card => `${card.title}. ${card.text}`;
export function citationText(card) { return card.text.length <= 420 ? card.text : card.text.slice(0,420).replace(/\s+\S*$/, ''); }
export function cosine(a,b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || !a.length) throw new Error('Embedding dimensions do not match.');
  let dot=0, aa=0, bb=0;
  for(let i=0;i<a.length;i++){ if(!Number.isFinite(a[i])||!Number.isFinite(b[i])) throw new Error('Invalid embedding value.'); dot+=a[i]*b[i]; aa+=a[i]*a[i]; bb+=b[i]*b[i]; }
  return aa && bb ? dot/Math.sqrt(aa*bb) : 0;
}
export function rankVectors(cards, vectors, queryVector, limit=3) {
  if(cards.length !== vectors.length) throw new Error('Archive and index are out of sync.');
  return cards.map((card,i)=>({id:card.id, score:cosine(vectors[i],queryVector)})).sort((a,b)=>b.score-a.score).slice(0,limit);
}
const tokens = text => (text.toLowerCase().match(/[\p{L}\p{N}]+/gu)||[]).filter(x=>x.length>2);
export function keywordSearch(cards, query, limit=3) {
  const terms = [...new Set(tokens(query))];
  if(!terms.length) return [];
  return cards.map(card=>{ const body=tokens(`${card.title} ${card.person} ${card.text}`); const score=terms.reduce((n,t)=>n+body.filter(w=>w===t).length,0); return {id:card.id,score}; }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,limit);
}
