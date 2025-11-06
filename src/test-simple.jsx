import ReactDOM from 'react-dom/client'

export default function TestApp() {
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Test App Working!</h1>
      <p>If you see this, React is working.</p>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<TestApp />)
