// load partners, if file not exist, return empty partners
async function loadPartnerMap(proteinId, basePath = './data/networks/') {
  const url = `${basePath}${proteinId}.json.gz`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  
    const bin  = new Uint8Array(await resp.arrayBuffer());  // gzip bytes
    const txt  = pako.ungzip(bin, { to: 'string' });        // gun-zip → text
    return JSON.parse(txt);                                 // { FBpp : gene }
  } catch (err) {
    return {};                                              // empty map
  }
}

/*  function to show the pop-up window  */ 
function showEdgeTooltip(edge, url) {

  /* 1 ─ kill any existing tooltip on this edge */
  if (edge.data('tippy')) {
    edge.data('tippy').destroy();
  }

  /* 2 ─ Popper virtual reference that tracks the edge */
  const ref = edge.popperRef();                       // from cytoscape-popper

  /* 3 ─ Dummy element that Tippy can actually attach to */
  const dummy = document.createElement('div');
  document.body.appendChild(dummy);                   // IMPORTANT!

  /* 4 ─ Create the tooltip */
  const tip = tippy(dummy, {
    getReferenceClientRect: ref.getBoundingClientRect, // glue to edge
    content   : `${url}`,
    allowHTML : true,
    theme     : 'light-border',
    animation : 'scale',
    interactive: true,
    trigger   : 'manual',
    appendTo  : () => document.body,   // so .contains() always succeeds
    onHidden(instance) {
      instance.destroy();              // destroys Tippy
      dummy.remove();                  // remove dummy element
      edge.removeData('tippy');        // clean handle on the edge
    }
  });

  tip.show();
  edge.data('tippy', tip);             // remember for next click
}

/* ---------- main renderer --------------------------------------------- */
async function renderPartnerNetwork({
    id,
    proteinAId,             // use Gene symbols here
    proteinBId,             // 
    geneAId,
    geneBId,
    ppi,
    basePath = './data/networks/'  // folder containing *.txt.gz
} = {}) {

  /* 1 ─ fetch partner maps */
  const [mapA, mapB] = await Promise.all([
    loadPartnerMap(proteinAId, basePath),   // { FBpp : gene }
    loadPartnerMap(proteinBId, basePath)
  ]);

  // Fbpp for clickable URL
  // Gene for network display
  const partnersAFbpp  = Object.keys(mapA);     // ["FBpp…", …]
  const partnersAGene  = Object.values(mapA);   // ["CG32350", …]
  const partnersBFbpp  = Object.keys(mapB);
  const partnersBGene  = Object.values(mapB);


  /* 2 Build Cytoscape elements */
  const nodes  = [
    { data: { id: geneAId, label: geneAId, rawId: `7227.${proteinAId}`, type: 'anchor' } },
    { data: { id: geneBId, label: geneBId, rawId: `7227.${proteinBId}`, type: 'anchor' } }
  ];

  const unique = new Set([geneAId, geneBId]);

  function pushPartner(fbpp, gene) {
    if (unique.has(gene)) return;
    unique.add(gene);
    nodes.push({
      data: { id: gene, label: gene, rawId: `7227.${fbpp}`, type: 'partner' }
    });
  }

  partnersAFbpp.forEach((fbpp, i) => pushPartner(fbpp, partnersAGene[i]));
  partnersBFbpp.forEach((fbpp, i) => pushPartner(fbpp, partnersBGene[i]));
 
  // add edges 
  const edges   = [];
  const edgeKey = new Set();

  function addEdge(srcGene, tgtGene, srcRaw, tgtRaw, ppiTag = 'partner') {
    const key = srcGene < tgtGene ? `${srcGene}|${tgtGene}` : `${tgtGene}|${srcGene}`;
    if (edgeKey.has(key)) return;
    edgeKey.add(key);
  
    edges.push({
      data: {
        id: key,
        source: srcGene,
        target: tgtGene,
        ppi: ppiTag,
        url: `details.html?id=${srcRaw}_${tgtRaw}`
      }
    });
  }

  ///* A—B edge only if partner files exist AND ppi ≠ "no" */
  ///*const showAB = (partnersA.length || partnersB.length) && (ppi !== 'no');*/
  const showAB = (ppi !== 'no or low confidence interactions');
  if (showAB) {
    //console.log(`adding A–B edge with ppi = ${ppi}`);
    addEdge(geneAId, geneBId, `7227.${proteinAId}`, `7227.${proteinBId}`, ppi);
  }

  /* A ↔ partnersA  (tagged as "partner") */
  partnersAFbpp.forEach((fbpp, i) => {
    if (partnersAGene[i] !== geneBId) {
      addEdge(geneAId, partnersAGene[i], `7227.${fbpp}`, `7227.${proteinAId}`);
    }
  });

  /* B ↔ partnersB  (tagged as "partner") */
  /* B ↔ partners of B */
  partnersBFbpp.forEach((fbpp, i) => {
    if (partnersBGene[i] !== geneAId) {
      addEdge(geneBId, partnersBGene[i], `7227.${proteinBId}`, `7227.${fbpp}`);
    }
  });
 
  /* 3 Initialise (or re-initialise) Cytoscape */
  const container = document.getElementById('network-container');
  container.innerHTML = '';          // clear previous graph if any
 
  const cy = cytoscape({
    container,
    elements: { nodes, edges },
    layout:   { name: 'cose', fit: true, padding: 40 },
 
    style: [
      /* anchors: A & B */
      {
        selector: 'node[type = "anchor"]',
        style: {
          'background-color': '#dc9f70',
          'width': 55, 'height': 55,
          'label': 'data(label)',
          'font-weight': 'bold',
          'font-size': 18,
          'color': '#0000FF',
          'text-valign': 'center',
        }
      },
      /* partners */
      {
        selector: 'node[type = "partner"]',
        style: {
          'background-color': '#96c8fa',
          'width': 33, 'height': 33,
          'label': 'data(label)',
          'font-size': 16,
          'color': '#303030',
          'text-valign': 'center'
        }
      },
      /* edges */
      {
        selector: 'edge[ppi = "high confidence interactions"]',
        style: {'line-color':'#0000FF','width':4,'line-style':'solid' }
      },
      {
        selector: 'edge[ppi = "acceptable interactions"]',
        style: {'line-color':'#00bcd4','width':3,'line-style':'solid','opacity':0.9 }
      },
      {
        selector: 'edge[ppi = "possible interactions"]',
        style: {'line-color':'#808080','width':3,'line-style':'dashed','opacity':0.7}
      },
      {
        selector: 'edge[ppi = "partner"]',
        style: {'line-color':'#808080','width':3,'line-style':'solid' }
      },
    ]
  });

  /*
  cy.style()
    .selector('edge.selected')
    .style({ 'line-color': '#FF00FF', 'width': 6 })
    .update();

  cy.on('tap', 'edge', e => {
    cy.edges().removeClass('selected');
    e.target.addClass('selected');
  });
  */

  // add a pop-up so users can click the lin
  cy.on('tap', 'edge', e => {
    const srcURL = e.target.source().data('rawId');
    const tgtURL = e.target.target().data('rawId');
    /* get source and target ID */
    const srcNode = e.target.source().id();
    const tgtNode = e.target.target().id();
  
  /* continue to pop-up window */
    const pair = srcURL < tgtURL
           ? `${srcURL}_${tgtURL}`
           : `${tgtURL}_${srcURL}`;
    //const url = `details.html?id=${pair}`;
    const url = (pair === id)
               ? `&nbsp;<strong>${ppi}</strong>&nbsp;`
               : `<a href="details.html?id=${pair}" target="_blank">View Predictions of ${srcNode}/${tgtNode}</a>`;

    showEdgeTooltip(e.target, url);   // now works error-free
    //if (pair !== id) {
    //  showEdgeTooltip(e.target, url);   // now works error-free
    //}
  });
}
