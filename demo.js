const {client} = require('tre-client')
const Finder = require('tre-finder')
const {RenderTimeline, renderPropertyTree} = require('.')
const h = require('mutant/html-element')
const setStyle = require('module-styles')('tre-timeline-demo')



client( (err, ssb, config) => {
  if (err) return console.error(err)

  const renderFinder = Finder(ssb, {
    details: kv => {
      const schema = kv.value.content.schema
      if (schema) {
        return renderPropertyTree(schema)
      }
      return []
    }
  })
  const finder = renderFinder(config.tre.branches.root, {
    path: []
  })

  const renderTimeline = RenderTimeline(ssb)

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
  body {
    font-family: sans-serif;
    font-size: 12pt;
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
    max-height: 12em;
    min-height: 1.2em;
    overflow-y: auto;
  }
`)

