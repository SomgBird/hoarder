import { oldWebTemplate } from './oldWeb'
//import { geocitiesTemplate } from './geocities'

const templates = {
  oldWeb: oldWebTemplate,
//  geocities: geocitiesTemplate,
}

export function renderItemPage(item) {
  const style = item.attributes?.pageStyle || 'oldWeb'
  const build = templates[style] || templates.oldWeb
  return build(item)
}