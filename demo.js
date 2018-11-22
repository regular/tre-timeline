const {client} = require('tre-client')
const Finder = require('tre-finder')
const Timeline = require('.')
const h = require('mutant/html-element')
const setStyle = require('module-styles')('tre-timeline-demo')

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
`)

client( (err, ssb, config) => {
  if (err) return console.error(err)

  const renderFinder = Finder(ssb, {})
  const finder = renderFinder(config.tre.branches.root, {path: []})

  const renderTimeline = Timeline(ssb)

  document.body.appendChild(h('.pane', [
    finder,
    renderTimeline(null, {tree_element: finder})
  ]))
})
