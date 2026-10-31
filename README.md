# Echoes, With Evidence

A quiet, browser-local memory archive and virtual ofrenda. Honor the past without inventing a voice for it. The “ghost in the machine” is a connection between saved stories, never a simulation of a person.

Created on 31 October 2026 for the DEV Hacktoberfest Week 4 challenge. Original application code, CSS illustrations and fictional story cards were created with AI assistance. The eight starter stories are entirely fictional; they are not the creator's family history.

## Run

Serve this directory with any static HTTP server, for example `python -m http.server 8769`, then open `http://localhost:8769`. A plain file URL is unsuitable for module workers. No build step, key, paid API or account is needed. Relative asset paths support GitHub Pages project directories.

## Demonstrate the real AI

1. Open the page. No external model, font or library is requested on startup. The initial search mode is visibly **Keyword matching · NOT AI**.
2. Choose **Load local AI**. This explicitly starts library/runtime downloads from jsDelivr and model/tokenizer downloads from Hugging Face. Quantized ONNX weights are 22,972,370 bytes (about 23 MB); additional runtime and tokenizer files are required. Download time and browser memory depend on the device.
3. Wait for **Local AI is ready**. This appears only after a real inference produces finite, 384-dimensional embeddings. The visible status exposes `#aiBox[data-ai-state="ready"][data-dimensions="384"]`.
4. Search **Learning to be brave**. The bicycle lesson should rank first. Try **A smell that feels like home** (orange peel) and **A garden shared with the community** (marigold seeds). Results visibly say **LOCAL AI · SEMANTIC SIMILARITY**, show raw cosine similarity and cite exact stored text. Inspect `#resultsSection` for `data-search-mode`, `data-dimensions`, `data-indexed-count`, and each article's card id / raw score.
5. Open a source card to compare the excerpt with its original text. Edit a story and search again: the local index rebuilds automatically. Add your own short English card to test a new connection.
6. A deliberately unrelated query can still have a nearest neighbor. Best cosine below 0.25 receives a visible weak-match warning. This is a design heuristic, not a calibrated probability threshold. Similarity is neither confidence nor a fact check.

If downloads fail, the interface reports the failure and leaves explicitly labeled keyword matching available. It never substitutes mock embeddings or generated answers. AI search happens in a dedicated browser worker; the interface remains usable while loading/indexing.

## Model and method

- Library: **Transformers.js 3.8.1**, Apache-2.0, loaded as a pinned browser ESM from jsDelivr only after the load button.
- Model: **Xenova/all-MiniLM-L6-v2**, Apache-2.0, pinned revision `751bff37182d3f1213fa05d7196b954e230abad9`.
- File: `onnx/model_quantized.onnx` (`dtype: 'q8'`); SHA-256 `afdb6f1a0e45b715d0bb9b11772f032c399babd23bfc31fed1c170afc848bdb1`.
- Task: `feature-extraction`; mean pooling and L2 normalization; **384 dimensions**. Browser inference uses ONNX Runtime Web / WASM, one thread for compatibility without cross-origin isolation.
- A card's title and text form its embedding input. Query/card vectors are compared with cosine similarity, and the top three card ids are returned. Excerpts are literal source text (up to the first 420 characters), never generated prose. Worker requests are serialized to prevent index races.
- The model targets English sentences and short paragraphs. Only the first 256 wordpieces are embedded by default; long memories may lose important context. Cards are limited to 3,000 characters, queries to 500, and archives to 100 cards. The full text is still available to read/export.

## Privacy, storage and limits

Story/query text is passed from the page to its own worker for local inference. It is not included in network URLs or sent to an inference service. Asset providers receive ordinary download metadata, such as IP address. There is no analytics, server database, login or paid service.

Edits live in the tab by default. Optional browser-local storage is explicitly opt-in; the same browser profile can read those saved cards, so this is not encryption or a vault. JSON export/import happens locally. Import replaces the table only after confirmation and validates field types, lengths and duplicate ids; user strings render as text, not HTML. Clear/delete actions require confirmation. Clearing cards does not delete exported files or browser-managed model caches.

The browser may cache model/runtime files. Cache availability, retention and complete offline reuse are **not guaranteed**; later loads may still need network. No service worker is installed. This project makes no claim of reliable offline-first asset delivery.

## Validation

Syntax and data/citation tests are performed locally. Independent real-model Node CPU tests have verified 384-dimensional normalized embeddings, seven of eight independent semantic cases ranking the expected card first, and all three suggested demo queries. A difficult paraphrase ranked the wrong card: this is a retrieval aid, not a source of truth. Node cache reuse without fetch does not establish browser offline behavior.

The project owner also verified real Chrome browser WASM inference through the actual interface: the 384-dimensional ready state, query “being brave while learning to balance”, and the bicycle lesson ranked first with cosine 0.321. The source dialog matched the complete stored text. This is a real browser inference check, not a mock. Deployment-specific checks are recorded separately by the project owner.

## Primary references

- [Model card and Apache-2.0 metadata](https://huggingface.co/Xenova/all-MiniLM-L6-v2)
- [Exact model revision](https://huggingface.co/Xenova/all-MiniLM-L6-v2/tree/751bff37182d3f1213fa05d7196b954e230abad9)
- [Transformers.js 3.8.1 custom settings](https://huggingface.co/docs/transformers.js/v3.8.1/en/custom_usage)
- [Transformers.js quantization dtypes](https://huggingface.co/docs/transformers.js/v3.8.1/en/guides/dtypes)
- [Transformers.js 3.8.1 environment source](https://github.com/huggingface/transformers.js/blob/3.8.1/src/env.js)

See `THIRD_PARTY_NOTICES.txt` for dependency credits and licenses. Original application code is MIT licensed.
