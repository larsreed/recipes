import './App.css'
import RecipeList from "./components/RecipeList.tsx";
import recipeLogo from './assets/recipe.png';


function App() {

  return (
      <>
          <h1>
              <img src={recipeLogo} alt="Recipe Logo" style={{height: '40px', marginRight: '10px'}}/>
              &nbsp;
              Recipes
          </h1>
          <div className="card">
              <RecipeList/>
          </div>
      </>
  )
}

export default App
