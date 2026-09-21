import { escapeHtml } from '../utils/escapeHtml'
import { gameFieldsHtml } from './fields/gameFields'
//import { comicFieldsHtml } from './fields/comicFields'

const fieldRenderers = {
  game: gameFieldsHtml,
//  comic: comicFieldsHtml,
}

export function oldWebTemplate(item) {
  const renderFields = fieldRenderers[item.category]
  const fieldsHtml = renderFields ? renderFields(item) : ''

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: 'Times New Roman', serif; background: #fff; margin: 8px; color: #000; }
          h1 { font-size: 18px; }
          table { border: 1px solid black; border-collapse: collapse; width: 100%; margin-top: 8px; }
          td { border: 1px solid black; padding: 4px 6px; }
          .counter { margin-top: 12px; font-family: monospace; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(item.title)}</h1>
        <p>${escapeHtml(item.notes || 'No notes yet.')}</p>
        <table>${fieldsHtml}</table>
        <p class="counter">You are visitor number: 000042</p>
      </body>
    </html>
  `
}