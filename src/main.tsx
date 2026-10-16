import { tr } from './i18n';
import { Component, StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './style.css';
class ErrorBoundary extends Component<{children:ReactNode},{error:boolean}> {
  state={error:false};
  static getDerivedStateFromError(){return {error:true};}
  render(){return this.state.error?<main className="app-main"><h1>{tr("No pudimos abrir la aplicación")}</h1><p>{tr("No se han borrado tus datos. Comprueba que el navegador permite almacenamiento local y vuelve a intentarlo.")}</p><button onClick={()=>location.reload()}>{tr("Volver a intentar")}</button></main>:this.props.children;}
}
createRoot(document.getElementById('root')!).render(<StrictMode><ErrorBoundary><App/></ErrorBoundary></StrictMode>);
