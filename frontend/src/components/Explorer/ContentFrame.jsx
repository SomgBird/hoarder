import { renderItemPage } from '../../templates'

function ContentFrame({ item }) {
  return (
    <iframe
      srcDoc={renderItemPage(item)}
      title={`${item.title} content`}
      style={{ width: '100%', height: 260, border: 'none', marginTop: 4 }}
      className="win95-sunken"
    />
  )
}

export default ContentFrame