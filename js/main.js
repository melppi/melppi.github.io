
/*  the main script to load and view structures
    moved from details.html to main.js by jpeng 06/19/2025*/

async function ViewStructure(id) {
  fetch(`./data/json_meta/${id}.meta.json.gz`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.arrayBuffer(); // Gzipped binary
    })

    .then(buffer => {
      const decompressed = pako.inflate(new Uint8Array(buffer), { to: 'string' }); // Decompress the data
      const info = JSON.parse(decompressed); // Parse the decompressed JSON

      // Show prediction detail
      document.getElementById('iptm').textContent = info.iptm;
      document.getElementById('pae').textContent = info.pae + ' Å';
      document.getElementById('pdockq').textContent = info.pdockq;
      document.getElementById('ppi').textContent = info.ppi;
      document.getElementById('ppiNet').textContent = info.ppi;

      // Show Annotation
      document.getElementById('proteinA').textContent = info.proA;
      document.getElementById('proteinB').textContent = info.proB;
      document.getElementById('geneA').textContent = info.geneA;
      document.getElementById('geneB').textContent = info.geneB;
      document.getElementById('geneAbutton').textContent = info.geneA;
      document.getElementById('geneBbutton').textContent = info.geneB;
      document.getElementById('geneA_IF').textContent = info.geneA;
      document.getElementById('geneB_IF').textContent = info.geneB;
      document.getElementById('annotationA').textContent = info.annotationA;
      document.getElementById('annotationB').textContent = info.annotationB;

      //const url = (info && info.ppi === 'high confidence interactions')
      //const url = (id === '7227.FBpp0080322_7227.FBpp0081861')
      //  ? `./data/${id}.pdb`
      //  //: `./data/link_not_activated.pdb`;
      //  : `https://storage.googleapis.com/dmelppi_zhaolab/mpdb/${id}.pdb.gz`;
      //const paeSrc = (id === '7227.FBpp0080322_7227.FBpp0081861')
      //  ? `./data/${id}_pae.jpg`
      //  : `./data/link_not_activated.png`;
      //document.getElementById("paefig").src = paeSrc;
      //console.log(url);
      const viewerInstance = new PDBeMolstarPlugin();
      const viewerContainer = document.getElementById("PDBeviewer");
      viewerInstance.render(viewerContainer, {
        moleculeId: id,
        customData: {
          //url,
          //url: `./data/pdb/${id}.pdb`,
          //url: `https://storage.googleapis.com/dmelppi_web/mpdb/${id}.pdb.gz`,
          url  : `https://storage.googleapis.com/dmelppi_zhaolab/mpdb/${id}.pdb.gz`,
          format: 'pdb',
          binary: false,
        },
        bgColor: { r: 255, g: 255, b: 255 },
        hideControls: true,
        pdbeLink: false,
        visual: {
          colorTheme: {
            name: "chain-id",
            params: {
              chainIdColorMap: {
                A: { r: 0, g: 255, b: 255 },
                B: { r: 255, g: 0, b: 0 }
              }
            }
          }
        }
      });


      document.getElementById("interfaceA").textContent = info.interfaceA;
      document.getElementById("interfaceB").textContent = info.interfaceB;

      document.getElementById("selectChainA").onclick = () => {
        viewerInstance.visual.select({ data: info.interfaceA_sel });
      };
      document.getElementById("selectChainB").onclick = () => {
        viewerInstance.visual.select({ data: info.interfaceB_sel });
      };
      document.getElementById("clearselection").onclick = () => {
        viewerInstance.visual.clearSelection();
      };

      // STRING network using version 11.5
      document.getElementById("stringAppContainer").id = "stringNetworkImage";
      ////getSTRING("https://string-db.org", {
      //getSTRING("https://version-11-5.string-db.org", {
      //  species: 7227,
      //  network_flavor: "evidence",          // or "confidence"
      //  identifiers: [info.proA, info.proB],
      //  caller_identity: "DmelPPI_web"
      //});
      const stringUrl =
        "https://version-11-5.string-db.org/api/image/network" +
        `?identifiers=${info.proA}%0d${info.proB}` +
        "&species=7227" +
        "&required_score=900" +                 // high confidence ≥ 0.9
        "&network_flavor=evidence";

      document.getElementById("stringNetworkImage").innerHTML =
        `<img src="${stringUrl}"`;
      console.log("Checking element:", document.getElementById("stringNetworkImage"));

      /* render PAE plot */
      const m = parseInt(info.prolen[info.proA]);
      const n = parseInt(info.prolen[info.proB]);
      //if (id === "7227.FBpp0080322_7227.FBpp0081861") {
      //  renderPAEPlot(id, info.geneA, info.geneB, m, n);
      //} else {
      //  renderPAELinkNotActivated();
      //}
      renderPAEPlot(id, info.geneA, info.geneB, m, n);

      // Interface plot
      //const pdockq = Number(info.pdockq);
      const ppiStatus = (info.ppi || '').trim().toLowerCase();
      const note   = document.getElementById('profileNote');
      //if (pdockq >= 0.23) {
      if (ppiStatus !== 'no or low confidence interactions') {
        // Line + track plot for each protein
        renderProfile("profileA", info, info.proA);
         renderProfile("profileB", info, info.proB);
      } else {
        document.getElementById("profileA").style.display = "none";
        document.getElementById("profileB").style.display = "none";
        note.textContent =
          `Interface detail not shown because it's of low confidence`;
        note.style.display = 'block';
      }

      // show the network
      const proteinAId = info.proA;   // from JSON or URL
      const proteinBId = info.proB;
      const geneAId = info.geneA;   // from JSON or URL
      const geneBId = info.geneB;
      const ppi = info.ppi;
      renderPartnerNetwork({id,proteinAId,proteinBId,geneAId,geneBId,ppi});
    });
}