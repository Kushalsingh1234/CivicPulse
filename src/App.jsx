import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Landing from './pages/Landing';
import Analyzer from './pages/Analyzer';
import Feed from './pages/Feed';
import Operations from './pages/Operations';
import IncidentDetails from './pages/IncidentDetails';
import NotFound from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Landing />} />
          <Route path="analyzer" element={<Analyzer />} />
          <Route path="feed" element={<Feed />} />
          <Route path="operations" element={<Operations />} />
          <Route path="incident/:id" element={<IncidentDetails />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
