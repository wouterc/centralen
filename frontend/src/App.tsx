import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppState } from './StateContext';
import OpgaverPage from './pages/OpgaverPage';
import UsersPage from './pages/UsersPage';
import VidensbankPage from './pages/VidensbankPage';
import TidsregistreringPage from './pages/TidsregistreringPage';
import AarshjulPage from './pages/AarshjulPage';
import PinboardPage from './pages/PinboardPage';
import Navigation from './components/Navigation';
import LoginPage from './pages/LoginPage';
import AppsPage from './pages/AppsPage';
import dayjs from 'dayjs';
import 'dayjs/locale/da';

dayjs.locale('da');

const App: React.FC = () => {
  const { state } = useAppState();

  if (!state.currentUser) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  const lastPage = localStorage.getItem('lastVisitedPage') || '/';

  return (
    <Router>
      <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
        <Navigation />
        <div className="flex-1 overflow-hidden relative">
          <Routes>
            <Route path="/" element={<Navigate to={lastPage} replace />} />
            <Route path="/board" element={<OpgaverPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/vidensbank" element={<VidensbankPage />} />
            <Route path="/tidsregistrering" element={<TidsregistreringPage />} />
            <Route path="/aarshjul" element={<AarshjulPage />} />
            <Route path="/prikbord" element={<PinboardPage />} />
            <Route path="/apps" element={<AppsPage />} />
            <Route path="/login" element={<Navigate to={lastPage} replace />} />
            <Route path="*" element={<Navigate to={lastPage} replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
