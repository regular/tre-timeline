const {client} = require('tre-client')
const Finder = require('tre-finder')
const Timeline = require('.')
const h = require('mutant/html-element')
const computed = require('mutant/computed')
const Value = require('mutant/value')
const setStyle = require('module-styles')('tre-timeline-demo')


const getProperties = require('get-properties-from-schema')
const pointer = require('json8-pointer')

function renderProprTree(schema) {
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

client( (err, ssb, config) => {
  if (err) return console.error(err)

  const renderFinder = Finder(ssb, {
    details: kv => {
      const schema = kv.value.content.schema
      if (schema) {
        return renderProprTree(schema)
      }
      return []
    }
  })
  const finder = renderFinder(config.tre.branches.root, {
    path: []
  })

  const renderTimeline = Timeline(ssb)

  document.body.appendChild(h('.pane', [
    finder,
    renderTimeline(null, {tree_element: finder})
  ]))
})

setStyle(`
  body {
    --tre-selection-color: green;
    --tre-secondary-selection-color: yellow;
  }
  .tre-finder {
    max-width: 300px;
    padding: 0;
  }
  body {
    font-family: sans-serif;
    font-size: 12pt;
  }
  .tre-finder ul {
    margin-top: 0;
    margin-bottom: 0;
  }
  .pane ::-webkit-scrollbar {
    height: 0px;
  }
  .pane {
    display: grid;
    grid-template-columns: 10em auto;
    grid-template-rows: 100%;
    grid-auto-flow: column;
    background: gold;
    width: 100%;
    height: min-content;
    max-height: 8em;
    overflow-y: auto;
  }
  .tre-finder .summary {
    white-space: nowrap;
  }
  .tre-finder [data-key]>.summary>details.properties {
    display: inline-block;
  }
`)

