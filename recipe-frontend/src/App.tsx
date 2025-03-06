import './App.css'
import RecipeList from "./components/RecipeList.tsx";
import SourceList from "./components/SourceList.tsx";


function App() {

  return (
    <>
      <h1>Recipes</h1>
      <div className="card">
          <RecipeList />
          <SourceList />
        </div>
    </>
  )
}

export default App
