import React from 'react';
import { Routes, Route } from 'react-router-dom';
import BoardPage from '../pages/BoardPage';
import Debug from '../pages/Debug';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Inicio directo en la pizarra */}
      <Route path="/" element={<BoardPage />} />  
      <Route path="/debug" element={<Debug />} />
    </Routes>
  );
};

export default AppRoutes;
