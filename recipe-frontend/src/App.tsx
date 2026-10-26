import './App.css'
import RecipeList from "./components/RecipeList.tsx";
import recipeLogo from './assets/recipe.png';


function App() {

  return (
      <>
          <div className="app-banner">
              <div className="banner-content">
                  <img src={recipeLogo} alt="Recipe Logo" className="banner-logo"/>
                  <div className="banner-text">
                      <h1 className="banner-title">Recipes</h1>
                      <p className="banner-subtitle">My personal cookbook</p>
                  </div>
              </div>
          </div>
          <div className="card">
              <RecipeList/>
          </div>
      </>
  )
}

export default App
