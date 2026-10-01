import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/NavBar/Layout";
import { routes } from "./config/navigation";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          {routes.map(({ path, Component }) => (
            <Route key={path} path={path} element={<Component />} />
          ))}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
