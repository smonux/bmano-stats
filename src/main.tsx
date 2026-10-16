import { Component, StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './style.css';
class ErrorBoundary extends Component<{children:ReactNode},{error:boolean}> {
  state={error:false};
  static getDerivedStateFromError(){return {error:true};}
  render(){return this.state.error?<main className="app-main"><h1>No pudimos abrir la aplicación</h1><p>No se han borrado tus datos. Comprueba que el navegador permite almacenamiento local y vuelve a intentarlo.</p><button onClick={()=>location.reload()}>Volver a intentar</button></main>:this.props.children;}
}
createRoot(document.getElementById('root')!).render(<StrictMode><ErrorBoundary><App/></ErrorBoundary></StrictMode>);
