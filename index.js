const h = require('mutant/html-element')
const pull = require('pull-stream')
const dom_mutants = require('pull-dom-mutants') 
const MutantArray = require('mutant/array')
const MutantMap = require('mutant/map')
const setStyle = require('module-styles')('tre-timeline')
const debounce = require('debounce')

module.exports = function RenderTimeline(sssb) {
  
  setStyle(`
    .tre-finder {
      margin-bottom: -1px;
    }
    .tre-finder li.drag-wrap {
      padding: 0;
      margin: 0;
    }
    .tre-finder summary {
      border-bottom: 1px solid silver;
      white-space: nowrap;
    }
    .tre-finder [data-key] {
      height: 100%;
      display: inline-block;
      padding: 1px;
      padding-top: 2px;
    }
    .tre-finder .summary {
      padding-bottom: 1px;
    }
    .tre-timeline .tracks {
      font-size: smaller;
      display: grid;
      gap: 1px;
      grid-template-columns: 10em repeat(auto-fill, 1em);
      grid-template-rows: repeat(auto-fill, 1fr);
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
      let row = -1
      const arr = [].slice.apply(els).map( el => {
        row++
        return {
          row,
          key: el.getAttribute('data-key')
        }
      })
      tracks.set(arr)
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

    function renderTrack({row, key}) {
      return [
        h('.track-control', {
          style: {
            'grid-row': `${row + 1} / span 1`,
            'grid-column': '1 / span 1',
            background: 'magenta',
            'place-self': 'stretch'
          }
        }, key.substr(0,6)),
        h('.keyframe', {
          style: {
            background: 'cyan',
            'grid-row': `${row + 1} / span 1`,
            'grid-column': `${row + 2} / span 1`
          }
        })
      ]
    }
    
    return h('.tre-timeline', {
      hooks: [el => abort],
    }, h('.tre-timeline.tracks', MutantMap(tracks, renderTrack)))
  }

}
