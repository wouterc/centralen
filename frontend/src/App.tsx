import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAppState } from './StateContext';
import OpgaverPage from './pages/OpgaverPage';
import UsersPage from './pages/UsersPage';
import VidensbankPage from './pages/VidensbankPage';
import TidsregistreringPage from './pages/TidsregistreringPage';
import AarshjulPage from './pages/AarshjulPage';
import PinboardPage from './pages/PinboardPage';
import Navigation from './components/Navigation';
import LoginPage from './pages/LoginPage';
import AcceptInvitationPage from './pages/AcceptInvitationPage';
import AppsPage from './pages/AppsPage';
import RequestWorkspacePage from './pages/RequestWorkspacePage';
import ConfirmWorkspacePage from './pages/ConfirmWorkspacePage';
import SettingsPage from './pages/SettingsPage';
import FlowchartPage from './pages/FlowchartPage';
import dayjs from 'dayjs';
import 'dayjs/locale/da';

dayjs.locale('da');

const AppRoutes: React.FC = () => {
  const { state } = useAppState();
  const location = useLocation();

  const hasWorkspaces = state.currentUser?.memberships && state.currentUser.memberships.length > 0;
  const isWorkspaceFlow = location.pathname.startsWith('/confirm-workspace') || 
                          location.pathname.startsWith('/request-workspace') || 
                          location.pathname.startsWith('/accept-invitation') ||
                          location.pathname === '/login';

  // While initializing session, show nothing or a loader
  if (state.isInitializing) {
    return (
      <div className="h-screen bg-gray-300 flex items-center justify-center">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white animate-pulse">
          <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }

  // If user is not logged in, OR they have no workspaces, OR they are specifically on a flow page,
  // show the "clean" layout without navigation.
  if (!state.currentUser || (!hasWorkspaces && !isWorkspaceFlow) || (isWorkspaceFlow && !hasWorkspaces)) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/accept-invitation/:token" element={<AcceptInvitationPage />} />
        <Route path="/request-workspace" element={<RequestWorkspacePage />} />
        <Route path="/confirm-workspace/:token" element={<ConfirmWorkspacePage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const lastPage = localStorage.getItem('lastVisitedPage');
  // Avoid redirecting back to workspace flow pages
  const initialPage = (lastPage && !lastPage.includes('workspace') && !lastPage.includes('invitation')) ? lastPage : '/board';

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      <Navigation />
      <div className="flex-1 overflow-hidden relative">
        <Routes>
          <Route path="/" element={<Navigate to={initialPage} replace />} />
          <Route path="/board" element={<OpgaverPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/vidensbank" element={<VidensbankPage />} />
          <Route path="/tidsregistrering" element={<TidsregistreringPage />} />
          <Route path="/aarshjul" element={<AarshjulPage />} />
          <Route path="/prikbord" element={<PinboardPage />} />
          <Route path="/apps" element={<AppsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/flowchart" element={<FlowchartPage />} />
          <Route path="/accept-invitation/:token" element={<AcceptInvitationPage />} />
          <Route path="/login" element={<Navigate to={initialPage} replace />} />
          <Route path="/request-workspace" element={<Navigate to={initialPage} replace />} />
          <Route path="/confirm-workspace/:token" element={<Navigate to={initialPage} replace />} />
          <Route path="*" element={<Navigate to={initialPage} replace />} />
        </Routes>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
};

export default App;
