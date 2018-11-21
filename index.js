const h = require('mutant/html-element')
const pull = require('pull-stream')
const dom_mutants = require('pull-dom-mutants') 
const MutantArray = require('mutant/array')
const MutantMap = require('mutant/map')
const setStyle = require('module-styles')('tre-timeline')
const debounce = require('debounce')

module.exports = function RenderTimeline(sssb) {
  
  setStyle(`
    .tre-finder li {
      white-space: nowrap;
    }
    .tre-timeline .tracks {
      display: grid;
      gap: 1px;
      //grid-template-columns: repeat(auto-fill, 1em);
      grid-auto-rows: minmax(1em, 1fr);
      grid-auto-flow: row;
      place-content: stretch;
      width: 100%;
      height: 100%;
      background: silver;
    }
    .tre-timeline .track {
      background: blue;
    }
  `)

  return function renderTimeline(kv, ctx) {
    ctx = ctx || {}
    const {tree_element} = ctx
    const tracks = MutantArray()

    const scan = debounce(function() {
      console.log('Scan')
      const els = tree_element.querySelectorAll('[data-key]')
      tracks.set(els)
      console.log(els)
    }, 10)

    const drain = pull.drain( record => {
      console.log(record)
      scan()
    })

    function abort() {
      console.log('timeline abort')
      scan.clear()
      drain.abort()
    }

    pull(dom_mutants(tree_element, {subtree: true}), drain)

    function renderTrack(el) {
      return h('.track', el.getAttribute('data-key'))
    }
    
    return h('.tre-timeline', {
      hooks: [el => abort],
    }, h('.tre-timeline.tracks', MutantMap(tracks, renderTrack)))
  }

}
