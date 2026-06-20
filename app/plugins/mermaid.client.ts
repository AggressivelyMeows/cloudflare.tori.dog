import mermaid from "mermaid"

const mermaidConfig: Parameters<typeof mermaid.initialize>[0] = {
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    // Base
    background: '#0c0a09',          // stone-950
    primaryColor: '#1c1917',        // stone-900  (node fill)
    primaryBorderColor: '#292524',  // stone-800
    primaryTextColor: '#e7e5e4',    // stone-200
    secondaryColor: '#292524',      // stone-800
    secondaryBorderColor: '#44403c',// stone-700
    secondaryTextColor: '#e7e5e4',  // stone-200
    tertiaryColor: '#1c1917',       // stone-900
    tertiaryBorderColor: '#44403c', // stone-700
    tertiaryTextColor: '#e7e5e4',   // stone-200

    // Lines & edges
    lineColor: '#78716c',           // stone-500
    edgeLabelBackground: '#0c0a09', // stone-950

    // Accents
    clusterBkg: '#1c1917',          // stone-900
    clusterBorder: '#44403c',       // stone-700
    titleColor: '#f97316',          // orange-500
    attributeBackgroundColorOdd: '#1c1917',  // stone-900
    attributeBackgroundColorEven: '#292524', // stone-800

    // Sequence diagrams
    actorBkg: '#1c1917',            // stone-900
    actorBorder: '#44403c',         // stone-700
    actorTextColor: '#e7e5e4',      // stone-200
    actorLineColor: '#78716c',      // stone-500
    signalColor: '#e7e5e4',         // stone-200
    signalTextColor: '#e7e5e4',     // stone-200
    labelBoxBkgColor: '#1c1917',    // stone-900
    labelBoxBorderColor: '#44403c', // stone-700
    labelTextColor: '#e7e5e4',      // stone-200
    loopTextColor: '#e7e5e4',       // stone-200
    activationBorderColor: '#f97316', // orange-500
    activationBkgColor: '#1c1917',  // stone-900
    sequenceNumberColor: '#f97316', // orange-500

    // Flowchart
    nodeBorder: '#44403c',          // stone-700
    nodeTextColor: '#e7e5e4',       // stone-200
    defaultLinkColor: '#78716c',    // stone-500

    // Git graph
    git0: '#f97316',                // orange-500
    git1: '#fb923c',                // orange-400
    git2: '#fdba74',                // orange-300
    git3: '#44403c',                // stone-700
    git4: '#57534e',                // stone-600
    git5: '#78716c',                // stone-500
    git6: '#a8a29e',                // stone-400
    git7: '#d6d3d1',                // stone-300
    gitBranchLabel0: '#0c0a09',
    gitBranchLabel1: '#0c0a09',
    gitBranchLabel2: '#0c0a09',
    gitBranchLabel3: '#e7e5e4',
    gitBranchLabel4: '#e7e5e4',
    gitBranchLabel5: '#e7e5e4',
    gitBranchLabel6: '#e7e5e4',
    gitBranchLabel7: '#e7e5e4',
    gitInv0: '#0c0a09',
    commitLabelColor: '#e7e5e4',
    commitLabelBackground: '#1c1917',
    commitLabelFontSize: '12px',
    tagLabelColor: '#0c0a09',
    tagLabelBackground: '#f97316',
    tagLabelBorder: '#f97316',
    tagLabelFontSize: '12px',

    // Typography
    fontFamily: "'DM Mono', 'IBM Plex Mono', monospace",
    fontSize: '14px',
  },
}

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.provide('mermaid', () => mermaid)
    nuxtApp.provide('mermaidConfig', mermaidConfig)
})