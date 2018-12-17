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
      overflow-x: auto;
    }
    .tre-finder li.drag-wrap {
      padding: 0;
      margin: 0;
    }
    .tre-finder summary {
      white-space: nowrap;
    }
    .tre-finder summary, .tre-finder summary * {
      vertical-align: top;
    }
    .tre-finder summary > [data-key] > .summary {
      border-bottom: 1px solid silver;
    }
    .tre-finder summary>span[data-key] {
      height: 100%;
      display: inline-block;
      padding: 1px;
      padding-top: 2px;
      width: fit-content;
      margin: 0;
    }
    .tre-finder [data-schema-name] {
      height: 100%;
      padding: 1px;
      padding-top: 2px;
      border-top: 1px solid silver;
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
      let els = tree_element.querySelectorAll('[data-key], [data-schema-path]')
      //els = Array.from(els).filter( x => !not_els.includes(x))
      let row = -1
      const arr = [].slice.apply(els).map( el => {
        row++
        return {
          row,
          key: el.getAttribute('data-key') || el.closest('[data-key]').getAttribute('data-key'),
          path: el.getAttribute('data-schema-path')
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

    function renderTrack({row, key, path}) {
      return [
        h('.track-control', {
          style: {
            'grid-row': `${row + 1} / span 1`,
            'grid-column': '1 / span 1',
            background: 'magenta',
            'place-self': 'stretch'
          }
        }, key.substr(0,6) + (path || '') ),
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
