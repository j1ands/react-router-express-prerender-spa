import './App.css'
import { NavLink } from 'react-router'

function App() {

  return (
    <nav className="nav">
      <NavLink to="/home">Home</NavLink>
      <NavLink to="/about">About</NavLink>
    </nav>
  )
}

export default App
