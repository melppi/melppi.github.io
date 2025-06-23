
/* render Interface */
function ss_to_rgb_array(ss) {
  return ss.map(code => {
    if (code === 1) return 0.5; // helix
    if (code === 2) return 1.0; // strand
    return 0.0; // coil
  });
}

// interface to array
function rangesToBinaryTrack(rangesStr, length) {
  const binaryTrack = new Array(length).fill(0);
  if (!rangesStr || typeof rangesStr !== "string" || rangesStr.trim() === "") return binaryTrack;

  const ranges = rangesStr.split(";");

  for (const range of ranges) {
    const [start, end] = range.split("-").map(Number);
    for (let i = start - 1; i < end; i++) {
      if (i >= 0 && i < length) binaryTrack[i] = 1;
    }
  }
  return binaryTrack;
}

function renderProfile(containerId, info, key) {
  const x = Array.from({ length: info.monomer_plddt[key].length }, (_, i) => i);
  const plddt = info.monomer_plddt[key].map(v => v / 100);
  const isd = info.monomer_isd[key].map(v => v / 100);
  const ss_mono = ss_to_rgb_array(info.monomer_ss[key]);
  const ss_complex = ss_to_rgb_array(info.complex_ss[key]);
  const idr = rangesToBinaryTrack(info.idr_if?.[key] ?? "", x.length);
  const cf = rangesToBinaryTrack(info.CF_if?.[key] ?? "", x.length);
  const c2o = rangesToBinaryTrack(info.coil2order_if?.[key] ?? "", x.length);
  const ord = rangesToBinaryTrack(info.order_if?.[key] ?? "", x.length);

  const data = [
    { x, y: plddt, type: 'scatter', name: 'PLDDT', line: { color: 'blue' }, yaxis: 'y1' },
    { x, y: isd, type: 'scatter', name: 'ISD', line: { color: 'black' }, yaxis: 'y1' },
    //{ z: [ss_mono], type: 'heatmap', name: 'SS (monomer)', showscale: false, yaxis: 'y2', xaxis: 'x', colorscale: [[0, '#ADD8E6'], [0.5, '#8000D7'], [1.0, '#FF8C00']],zmin:0,zmax:1},
    { z: [ss_mono], type: 'heatmap', name: 'SS (monomer)', showscale: false, yaxis: 'y2', xaxis: 'x', coloraxis: 'coloraxis', zmin:0, zmax:1.0},
    { z: [ss_complex], type: 'heatmap', name: 'SS (complex)', showscale: false, yaxis: 'y3', xaxis: 'x', colorscale: [[0, '#ADD8E6'], [0.5, '#8000D7'], [1.0, '#FF8C00']],zmin:0,zmax:1},
    //{ z: [ss_complex], type: 'heatmap', name: 'SS (complex)', showscale: false, yaxis: 'y3', xaxis: 'x', colorscale: 'coloraxis', zmin: 0, zmax: 1},
    { z: [idr], type: 'heatmap', name: 'IF(IDR)', showscale: false, yaxis: 'y4', xaxis: 'x', colorscale: [[0, 'lightgray'], [1, '#8B0000']],zmin: 0,zmax: 1, },
    { z: [cf], type: 'heatmap', name: 'IF(CF)', showscale: false, yaxis: 'y5', xaxis: 'x', colorscale: [[0, 'lightgray'], [1, '#8B0000']],zmin: 0,zmax: 1, },
    { z: [c2o], type: 'heatmap', name: 'IF(coil2order)', showscale: false, yaxis: 'y6', xaxis: 'x', colorscale: [[0, 'lightgray'], [1, '#8B0000']],zmin: 0,zmax: 1,  },
    { z: [ord], type: 'heatmap', name: 'IF(order)', showscale: false, yaxis: 'y7', xaxis: 'x', colorscale: [[0, 'lightgray'], [1, '#8B0000']],zmin: 0,zmax: 1,  }
  ];
  //console.log('ss_mono →', ss_mono);
  //console.log('ss_complex →', ss_complex);

  const yLabels = [
    ['PLDDT/ISD', -0.3,0.96],
    ['SS (monomer)',-0.305,0.54],
    ['SS (complex)',-0.28,0.45],
    ['IF(IDR)',-0.162,0.35],
    ['IF(CF)',-0.145,0.22],
    ['IF(coil2order)',-0.285,0.12],
    ['IF(Ordered)',-0.250,0.02]
  ];

  const annotations = yLabels.map(([text, x,y]) => ({
    text,
    xref: 'paper',
    yref: 'paper',
    x,
    y,
    showarrow: false,
    textangle: 0,
    font: { size: 10 },
    align: 'center'
  }));

  const layout = {
    height: 300,  
    margin: {t: 1, b: 1 },
    xaxis:  {domain: [0, 1],showticklabels:true,side:'top',tickfont:{size:10},showline: true},
    yaxis:  {domain: [0.62, 0.92],title:'', range: [0, 1], tickvals: [0,0.5,0.7,0.9], ticktext: ['0.5','0.7','0.9'],tickfont:{size:10}},
    yaxis2: {domain: [0.52, 0.57],title:'', showticklabels:false, ticks:''},
    yaxis3: {domain: [0.42, 0.47],title:'', showticklabels:false, ticks:''},
    yaxis4: {domain: [0.32, 0.37],title:'', showticklabels:false, ticks:''},
    yaxis5: {domain: [0.22, 0.27],title:'', showticklabels:false, ticks:''},
    yaxis6: {domain: [0.12, 0.17],title:'', showticklabels:false, ticks:''},
    yaxis7: {domain: [0.02, 0.07],title:'', showticklabels:false, ticks:''},
    legend: {
      x: 1.02,
      y: 0.90,
      bgcolor: 'rgba(255,255,255,0.9)',
      bordercolor: 'white',
      borderwidth: 0,
      font: {size: 10},
      itemwidth: 15
    },
    shapes: [
      { type: 'line', xref: 'paper', x0: 0, x1: 1, yref: 'y1', y0: 0.5, y1: 0.5, line: { color: 'black', width: 1, dash: 'dot' } },
      { type: 'line', xref: 'paper', x0: 0, x1: 1, yref: 'y1', y0: 0.7, y1: 0.7, line: { color: 'lightblue', width: 1, dash: 'dot' } },
      { type: 'line', xref: 'paper', x0: 0, x1: 1, yref: 'y1', y0: 0.9, y1: 0.9, line: { color: 'blue', width: 1, dash: 'dot' } }
    ],
    coloraxis: {
        // repeat each colour at its start & end value → sharp steps
        colorscale: [
            [0.00, '#ADD8E6'],   // coil  (light-blue)  0.00‒0.333
            [0.33, '#ADD8E6'],

            [0.33, '#8000D7'],   // helix (purple)      0.333‒0.666
            [0.66, '#8000D7'],

            [0.66, '#FF8C00'],   // strand (orange)     0.666‒1.00
            [1.00, '#FF8C00']
        ],
        cmin: 0,
        cmax: 1,

        colorbar: {
            //title: { text: 'Secondary&nbsp;structure', side: 'right' },
            x: 1.020,
            y: 0.5,
            len: 0.18,          // 20 % of plot height
            thickness: 6,

            tickmode: 'array',
            tickvals: [0.165, 0.495, 0.83],   // mid-point of each block
            ticktext: ['Coil', 'Helix', 'Strand'],

            ticklen: 0,        // hide little tick marks
            tickfont: { size: 10 }
        }
    },
    //margin: { r: 120, t: 1, b: 1 },
    annotations
  };

  Plotly.newPlot(containerId, data, layout);
}
