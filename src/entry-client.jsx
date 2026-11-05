import React from 'react';
import {createRoot,hydrateRoot} from 'react-dom/client';
import App from './App.jsx';
import {installBuildTool} from './build-webmcp.js';
const root=document.getElementById('root');
const app=<App url={location.pathname+location.search}/>;
// Sites may serve the homepage as an empty client shell; interior routes have SSR markup.
if(root.firstElementChild)hydrateRoot(root,app);
else createRoot(root).render(app);
installBuildTool();
