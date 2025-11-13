
/* interactive PAE plot */
// initiate link not activated

function renderPAELinkNotActivated() {
  Plotly.newPlot('paefig', [], {
    annotations: [{
      text: 'LINK<br>NOT<br>ACTIVATED',
      xref: 'paper',
      yref: 'paper',
      x: 0.25,
      y: 0.55,
      xanchor: 'left',
      yanchor: 'middle',
      align: 'left',
      showarrow: false,
      font: { size: 36, color: 'blue' },
    }],
    xaxis: { visible: false },
    yaxis: { visible: false },
    margin: { l: 0, r: 0, t: 0, b: 0 }
  });
}
// activate link
async function renderPAEPlot(id,proA,proB,m,n) {
  //const paeText = await fetchGzAsText(`./data/pae_raw/${id}.pae.txt.gz`);
  //const paeFlat = paeText.split(',').map(Number);
  //const paeFlat = await fetchZstAsText(`./data/pae_raw/${id}.pae.asc.zst`);
  //const paeFlat = await fetchXzAsciiInts(`./data/pae_asctxt/${id}.pae.asc.xz`);
  const paeFlat = await fetchXzAsciiInts(`https://storage.googleapis.com/dmelppi_zhaolab/mPAE/${id}.pae.asc.xz`);


  const totalLen = m + n;
  if (paeFlat.length !== totalLen * totalLen) {
      console.error(`Expected ${(totalLen ** 2)} PAE values, got ${paeFlat.length}`);
      return;
  }

  //const paeMatrix = Array.from({ length: totalLen }, (_, i) =>
  //  paeFlat.slice(i * totalLen, (i + 1) * totalLen)
  //);
  const paeMatrix = Array.from({ length: totalLen }, (_, i) =>
    paeFlat.slice(i * totalLen, (i + 1) * totalLen)
  );

  const midpointA = Math.floor(m / 2);
  const midpointB = m + Math.floor(n / 2);
  const { tickvals: xResidueTicks, ticktext: xResidueLabels } = getSplitHumanTicks(m, n);
  const { tickvals: yResidueTicks, ticktext: yResidueLabels } = getSplitHumanTicks(m, n);

  Plotly.newPlot('paefig', [{
    z: paeMatrix,
    type: 'heatmap',
    //colorscale: 'bwr',
    colorscale: [
      [0.0, '#0000ff'],
      [0.5, '#ffffff'],
      [1.0, '#ff0000']
    ],
    zmin: 2,
    zmax: 31,
    colorbar: {
      title: {text: 'Predicted Aligned Error (Å)',side: 'right'},
      x: 1.0,
      y: 0.5,
      thickness: 6,
      tickfont: { size: 10 },
      titlefont: { size: 12},
      len: 0.68
    }
  }], {
    xaxis: {
      title: '',
      tickmode: 'array',
      tickvals: xResidueTicks,
      ticktext: xResidueLabels,
      tickfont: { size: 10},
      tickpadding: 0,
      side: 'bottom',
      ticklen: 3,
      showgrid: false
    },
    yaxis: {
      title: '',
      autorange: 'reversed',
      tickmode: 'array',
      tickvals: yResidueTicks,
      ticktext: yResidueLabels,
      tickfont: { size: 10 },
      tickpadding: -0.5,
      showgrid: false
    },
    margin: { l: 50, r: 0, b: 40, t: 3 },
    shapes: [
      // Vertical divider between chains
      {
        type: 'line',
        x0: m - 0.5,
        x1: m - 0.5,
        y0: 0,
        y1: totalLen - 1,
        line: { color: 'black', width: 3.6, dash: 'dot' }
      },
      // Horizontal divider between chains
      {
        type: 'line',
        x0: 0,
        x1: totalLen - 1,
        y0: m - 0.5,
        y1: m - 0.5,
        line: { color: 'black', width: 3.6, dash: 'dot' }
      }
    ],

    annotations: [
      {
        x: midpointA,
        y: -0.136,
        xref: 'x',
        yref: 'paper',
        text: proA,
        showarrow: false,
        font: { size: 12 },
        align: 'center'
      },
      {
        x: midpointB,
        y: -0.136,
        xref: 'x',
        yref: 'paper',
        text: proB,
        showarrow: false,
        font: { size: 12 },
        align: 'center'
      },
      {
        x: -0.16,
        y: midpointA,
        xref: 'paper',
        yref: 'y',
        text: proA,
        showarrow: false,
        font: { size: 12 },
        align: 'center',
        textangle: -90
      },
      {
        x: -0.16,
        y: midpointB,
        xref: 'paper',
        yref: 'y',
        text: proB,
        showarrow: false,
        font: { size: 12 },
        align: 'center',
        textangle: -90
      }
    ]
  });
}