import { useState, useRef, useEffect } from 'react'
import { Frame, TitleBar } from '@react95/core'

function DosPanel({ onClose }) {
  const [history, setHistory] = useState([
    'MS-DOS Collection Search v1.0',
    'Type a title and press Enter to search.',
    '',
  ])
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [history])

  async function runSearch(query) {
    setHistory((h) => [...h, `C:\\COLLECTION> ${query}`])
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/items?search=${encodeURIComponent(query)}`
      )
      const results = await res.json()
      if (results.length === 0) {
        setHistory((h) => [...h, 'No matching items found.', ''])
      } else {
        const lines = results.map(
          (item) => `${item.title.padEnd(30)} ${item.category.padEnd(8)} ${item.status}`
        )
        setHistory((h) => [...h, ...lines, ''])
      }
    } catch {
      setHistory((h) => [...h, 'ERROR: could not reach server.', ''])
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && input.trim()) {
      runSearch(input.trim())
      setInput('')
    }
  }

  return (
    <Frame
      w="440px"
      bgColor="$material"
      boxShadow="$out"
      padding="$2"
      style={{ position: 'absolute', top: 40, left: 40 }}
    >
      <TitleBar title="MS-DOS Prompt — Collection Search">
        <TitleBar.OptionsBox>
          <TitleBar.Close onClick={onClose} />
        </TitleBar.OptionsBox>
      </TitleBar>

      <div
        style={{
          background: '#000000',
          color: '#33ff33',
          fontFamily: '"Courier New", monospace',
          fontSize: 13,
          padding: 8,
          height: 220,
          overflowY: 'auto',
          whiteSpace: 'pre-wrap',
        }}
        onClick={() => document.getElementById('dos-input')?.focus()}
      >
        {history.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <span>C:\COLLECTION&gt;&nbsp;</span>
            <input
                id="dos-input"
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                padding: 0,
                color: '#33ff33',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                caretColor: 'transparent',
                width: `${input.length}ch`,
                minWidth: 0,
                }}
            />
            <span className="dos-cursor">█</span>
            </div>
        <div ref={bottomRef} />
      </div>
    </Frame>
  )
}

export default DosPanel