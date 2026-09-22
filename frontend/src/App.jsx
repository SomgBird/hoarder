import { useState, useEffect } from 'react'
import { Frame, TitleBar } from '@react95/core'
import { Notepad } from '@react95/icons'
import ExplorerWindow from './components/Explorer/ExplorerWindow'
import DosPanel from './components/DosPanel/DosPanel'
import AddItemForm from './components/AddItemForm'

function App() {
  const [items, setItems] = useState([])
  const [minimized, setMinimized] = useState(false)
  const [openItemIds, setOpenItemIds] = useState([])
  const [showDosPanel, setShowDosPanel] = useState(false)
  const [showAddItemPFrom, setShowAdditemForm] = useState(false)

  useEffect(() => {
    fetch('http://127.0.0.1:8000/items')
      .then((res) => res.json())
      .then(setItems)
      .catch((err) => console.error('Failed to fetch items:', err))
  }, [])

  function openItem(id) {
    setOpenItemIds((ids) => (ids.includes(id) ? ids : [...ids, id]))
  }

  function closeItem(id) {
    setOpenItemIds((ids) => ids.filter((openId) => openId !== id))
  }

  return (
    <>
      <Frame w="500px" bgColor="$material" boxShadow="$out" padding="$3" >
        <TitleBar
          title="Collection Manager"
          onClick={() => minimized && setMinimized(false)}
          icon={<Notepad variant="16x16_4"/>}
        >
          <TitleBar.OptionsBox>
            <TitleBar.Help />
            <TitleBar.Minimize onClick={() => setMinimized(true)} />
            <TitleBar.Maximize />
            <TitleBar.Close />
          </TitleBar.OptionsBox>
        </TitleBar>

        {!minimized && (
          <Frame bgColor="$inputBackground" boxShadow="$in" padding="$2">
            {items.length === 0 && <p style={{ margin: 4 }}>No items yet.</p>}
            {items.map((item, i) => (
              <div
                key={item.id}
                onClick={() => openItem(item.id)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '3px 4px',
                  cursor: 'pointer',
                  backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.04)',
                }}
              >
                <span>{item.title}</span>
                <span>{item.category}</span>
                <span style={{ opacity: item.status === 'wanted' ? 0.6 : 1 }}>
                  {item.status}
                </span>
              </div>
            ))}
          </Frame>
        )}
      </Frame>

      {openItemIds.map((id, i) => {
        const item = items.find((it) => it.id === id)
        if (!item) return null
        return (
          <ExplorerWindow
            key={id}
            item={item}
            onClose={() => closeItem(id)}
            style={{ top: 40 + i * 30, left: 540 + i * 20 }}
          />
        )
      })}

      {showDosPanel && <DosPanel onClose={() => setShowDosPanel(false)} />}
      
      {showAddItemPFrom && <AddItemForm onClose={() => setShowAdditemForm(false)} onAdded={(item) => console.log("created:", item)} />}

      <div
        className="win95-raised"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          padding: '0 6px',
        }}
      >
        <button
          className="win95-raised"
          onClick={() => setShowDosPanel((s) => !s)}
          style={{ padding: '4px 10px', fontWeight: 'bold' }}
        >
          🖥 MS-DOS Search
        </button>

        <button
          className="win95-raised"
          onClick={() => setShowAdditemForm((s) => !s)}
          style={{ padding: '4px 10px', fontWeight: 'bold' }}
        >
          Add Item
        </button>
      </div>
    </>
  )
}

export default App