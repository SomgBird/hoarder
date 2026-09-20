import { useState, useEffect } from 'react'

function App() {
  const [message, setMessage] = useState('loading...')

  useEffect(() => {
    fetch('http://127.0.0.1:8000/')
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(() => setMessage('Could not reach backend'))
  }, [])

  return (
    <div>
      <h1>{message}</h1>
    </div>
  )
}

export default App
