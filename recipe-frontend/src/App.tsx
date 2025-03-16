import './App.css'
import RecipeList from "./components/RecipeList.tsx";


function App() {

  return (
    <>
      <h1>Recipes</h1>
      <div className="card">
          <RecipeList />
        </div>
    </>
  )
}

export default App
