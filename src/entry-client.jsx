import React from 'react';
import {hydrateRoot} from 'react-dom/client';
import App from './App.jsx';
import {installBuildTool} from './build-webmcp.js';
hydrateRoot(document.getElementById('root'),<App url={location.pathname+location.search}/>);
installBuildTool();
