import { Routes, Route, BrowserRouter } from 'react-router-dom'
import './App.css'
import Home from './Components/Home/Home'
import ProductsList from './Components/ProductsList/ProductsList'
import ProductPage from './Components/ProductPage/ProductPage'

function App() {


  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Home />}></Route>
        <Route path='/products-list' element={<ProductsList />}></Route>
        <Route path='/:id' element={<ProductPage />}></Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
