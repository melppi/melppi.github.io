/*  utilites
    moved from details.html to util.js by jpeng 06/19/2025
*/

/* borrowed from my plot_pae.py */
function humanFormat(num) {
  const magnitudes = ['', 'K', 'M', 'B', 'T'];
  let magnitude = 0;
  while (Math.abs(num) >= 1000 && magnitude < magnitudes.length - 1) {
    magnitude++;
    num /= 1000.0;
  }
  return parseFloat(num.toPrecision(3)).toString().replace(/\.0+$/, '').replace(/(\.\d+?)0+$/, '$1') + magnitudes[magnitude];
}

/* adaptive assignment of axis ticklabel*/
/* from plot_pae.py */
function getHumanTicks(ndim) {
  let i5 = 1;
  const l5 = 50;
  let n5 = Math.floor(ndim / (i5 * l5));

  while (n5 > 5) {
    i5 = i5 >= 2 ? i5 + 2 : i5 + 1;
    n5 = Math.floor(ndim / (i5 * l5));
  }

  const step = i5 * l5;
  const ticks = Array.from({ length: Math.floor(ndim / step) + 1 }, (_, i) => i * step);
  const ticklabels = ticks.map(humanFormat);
  return { ticks, ticklabels };
}

/* index reset to 0 for chain B*/
function getSplitHumanTicks(lenA, lenB) {
  const { ticks: ticksA, ticklabels: labelsA } = getHumanTicks(lenA);
  const { ticks: ticksB, ticklabels: labelsB } = getHumanTicks(lenB);

  const tickvals = ticksA.concat(ticksB.map(t => lenA + t));
  const ticktext = labelsA.concat(labelsB);

  return { tickvals, ticktext };
}

// fetch Zstd-compressed text file from URL
//import initZstdDecoder from 'https://cdn.jsdelivr.net/npm/zstddec@0.2.1/+esm';
async function fetchZstAsText(url) {
  const { ZSTDDecoder } = await import('https://cdn.jsdelivr.net/npm/@thewtex/zstddec@0.2.0/+esm');
  const resp = await fetch(url);
  const compressed = new Uint8Array(await resp.arrayBuffer());

  const decoder = new ZSTDDecoder();
  await decoder.init();

  const decompressed = decoder.decode(compressed);
  const text = new TextDecoder().decode(decompressed);
  const values = Array.from(text, c => c.charCodeAt(0) - 32); // 1-based
  return values;
}
// read gzip txt
async function fetchGzAsText(url) {
  const resp = await fetch(url);
  const buf  = await resp.arrayBuffer();        // raw gzip bytes
  const uint = new Uint8Array(buf);
  return new TextDecoder().decode(pako.inflate(uint));
}
// read gzip ASCII text
async function fetchGzAsciiInts(url) {
  const txt  = await fetchGzAsText(url);      // gunzip → string
  const len  = txt.length;jjjjjjjj
  const codes = new Int32Array(len);

  for (let i = 0; i < len; i++) {
    codes[i] = txt.charCodeAt(i);
  }
  return codes;
}

// read XZ format ASCII codes into array 
const { XzReadableStream } = window.xzwasm;
// the function
async function fetchXzAsciiInts(url) {
    // 1 fetch the .xz
    const compressedResponse = await fetch(url);

    // 2 wrap its body in the decoder
    const decompressedResponse = new Response(
      new XzReadableStream(compressedResponse.body)
    );
    // 3 decompress 
    const txt = await decompressedResponse.text();
    // 4 every character → its code
    return Int32Array.from(txt, c => c.charCodeAt(0)-32);
}

/* check if PDB exist */
async function resolvePDBUrl(id, info) {
  const highConf = info && info.ppi === 'high confidence interactions';
  const pdbPath = `./data/highconfPDB/${id}.pdb`;
  const fallbackPath = `./data/link_not_activated.pdb`;

  if (!highConf) return fallbackPath;

  try {
    const response = await fetch(pdbPath, { method: 'HEAD' }); // use HEAD to check existence only
    if (response.ok) {
      return pdbPath;
    } else {
      return fallbackPath;
    }
  } catch (err) {
    return fallbackPath;
  }
}