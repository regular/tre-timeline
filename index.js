const h = require('mutant/html-element')
const pull = require('pull-stream')
const dom_mutants = require('pull-dom-mutants') 
const MutantArray = require('mutant/array')
const MutantMap = require('mutant/map')
const computed = require('mutant/computed')
const Value = require('mutant/value')
const setStyle = require('module-styles')('tre-timeline')
const debounce = require('debounce')
const getProperties = require('get-properties-from-schema')
const pointer = require('json8-pointer')

function renderPropertyTree(schema) {
  const skvs = getProperties(schema)
  if (!skvs.length) return []

  const open = Value(false)
  return h('details.properties', {
    'ev-toggle': e => {
      open.set(e.target.open)
    }
  }, [
    h('summary', 'Properties'),
    computed(open, o => o ? skvs.map(skv => renderProperty(skv, [])).filter(Boolean) : [])
  ])

  function renderProperty(skv, path) {
    const fullPath = path.concat([skv.key])
    const title = skv.value.title || skv.key
    const open = Value(false)
    if (skv.value.type == 'object') {
      return h('details.properties', {
        'ev-toggle': e => {
          open.set(e.target.open)
        }
      }, [
        h('summary', {
          attributes: {
            'data-schema-type': 'object',
            'data-schema-name': skv.key,
            'data-schema-path': pointer.encode(fullPath)
          }
        
        }, title),
        computed(open, o => o ? h('div.properties', {
        }, getProperties(skv.value).map(skv => renderProperty(skv, fullPath).filter(Boolean))
        ) :  [])
      ])
    }
    if ('number integer string'.split(' ').includes(skv.value.type)) {
      return [
        h('div.property', {
          attributes: {
            'data-schema-type': skv.value.type,
            'data-schema-name': skv.key,
            'data-schema-path': pointer.encode(fullPath)
          }
        }, [
          h('span', title),
        ])
      ]
    }
  }
}

function RenderTimeline(sssb) {
  
  setStyle(`
    .tre-finder {
      max-width: 300px;
      padding: 0;
      margin-bottom: -1px;
      overflow-x: auto;
    }
    .tre-finder ul {
      margin-top: 0;
      margin-bottom: 0;
    }
    .tre-finder li.drag-wrap {
      padding: 0;
      margin: 0;
    }
    .tre-finder summary {
      white-space: nowrap;
    }
    .tre-finder .summary {
      white-space: nowrap;
      padding-bottom: 1px;
    }
    .tre-finder [data-key]>.summary>details.properties {
      display: inline-block;
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
      overflow-x: hidden;
    }
    .tre-timeline .track-bg {
      background: rgba(0,0,100,0.3);
      place-self: stretch;
    }
    .tre-timeline .track-bg.hover {
      background: rgba(0,0,200,0.7);
    }
    .tre-timeline .lastFrameSlot {
      background: yellow;
    }
    .tre-timeline .frameSlot {
      background: rgba(200,250,200,0.2);
    }
    .tre-timeline .frameSlot:hover {
      background: rgba(200,200,250,0.6);
    }
    .tre-timeline .keyframe {
      background: cyan;
      border-radius: 25%;
      margin: 1px 1px;
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
        h('.track-bg', {
          style: {
            'grid-row': `${row + 1} / span 1`,
            'grid-column': '2 / -1'
          },
          /* has no effect, because tracks are covered by frameSlots
          'ev-mouseenter': e => {
            console.log('enter', e.target)
            e.target.classList.add('hover')
          },
          'ev-mouseleave': e => {
            console.log('leave', e.target)
            e.target.classList.remove('hover')
          }
          */
        }),
        h('.keyframe', {
          style: {
            'grid-row': `${row + 1} / span 1`,
            'grid-column': `${row + 2} / span 1`
          }
        })
      ]
    }

    function frameSlots(grid, last, gridRowObs) {
      console.warn('frameSlots')
      const lastbb = last.getBoundingClientRect()
      const gridbb = grid.getBoundingClientRect()
      const trackCtrl = grid.querySelector('.track-control')
      const ctrlbb = trackCtrl.getBoundingClientRect()
      const gap = Number(grid.computedStyleMap().get('grid-column-gap').toString().replace('px',''))

      const frameCount = (gridbb.width - ctrlbb.width) / (lastbb.width + gap)
      for(let frame=0; frame<frameCount; ++frame) {
        const frameSlot = h('.frameSlot', {
          style: {
            'grid-column': `${frame + 2} / span 1`,
            'grid-row': gridRowObs
          }
        }, frame % 5 ? [] : frame)
        grid.appendChild(frameSlot)
      }
    }

    const gridRowObs = computed(tracks, t => `1 / ${t.length + 1}`)
    const hasTracks = computed(tracks, t => !!t.length)
    let grid, lastFrameSlot, addedFrameSlots = false
    const el = h('.tre-timeline', {
      hooks: [el => abort]
    }, [
      grid = h('.tracks', [
        MutantMap(tracks, renderTrack),
        lastFrameSlot = h('.lastFrameSlot', {
          style: {
            'grid-column': '-2 / span 1',
            'grid-row': gridRowObs
          }
        }),
        computed(hasTracks, t => t ? frameSlots(grid, lastFrameSlot, gridRowObs) : [])
      ]),
    ])

    return el
  }

}

module.exports = {
  RenderTimeline,
  renderPropertyTree
}
