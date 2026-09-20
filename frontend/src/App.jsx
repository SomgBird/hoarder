import { useState, useEffect } from 'react'
import { Frame, TitleBar } from '@react95/core'
import { Notepad } from '@react95/icons'

function App() {
  const [items, setItems] = useState([])
  const [minimized, setMinimized] = useState(false)

  useEffect(() => {
    fetch('http://127.0.0.1:8000/items')
      .then(res => res.json())
      .then(setItems)
      .catch(err => console.error('Failed to fetch items:', err))
  }, [])

  return (
    <Frame w="500px" bgColor="$material" boxShadow="$out" padding="$3">
      <TitleBar
        title="Collection Manager"
        onClick={() => minimized && setMinimized(false)}
        icon={<Notepad variant="16x16_4"/>}
      >
        <TitleBar.OptionsBox>
          <TitleBar.Help />
          <TitleBar.Minimize onClick={() => setMinimized(true)}/>
          <TitleBar.Maximize />
          <TitleBar.Close />
        </TitleBar.OptionsBox>
      </TitleBar>

      {!minimized && (
        <Frame bgColor="white">
          {items.length === 0 && <p style={{ margin: 4 }}>No items yet.</p>}
          {items.map((item, i) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '3px 4px',
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
  )
}

export default App