import { Navigate, Route, Routes } from 'react-router-dom';
import { MainLayout } from '../components';
import { BrowsePage } from '../pages/Browse';
import { DetailsPage } from '../pages/Details';
import { HomePage } from '../pages/Home';
import { SearchPage } from '../pages/Search';

export function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/details" element={<DetailsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MainLayout>
  );
}

export default App;
