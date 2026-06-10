import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import { LoginPage, SignupPage } from './pages/AuthPages';
import SearchPage from './pages/SearchPage';
import AnimeDetailPage from './pages/AnimeDetailPage';
import MoodMatcherPage from './pages/MoodMatcherPage';
import MyListPage from './pages/MyListPage';
import ProfilePage from './pages/ProfilePage';
import ShopPage from './pages/ShopPage';
import InventoryPage from './pages/InventoryPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/anime/:id" element={<AnimeDetailPage />} />
            <Route path="/mood" element={<MoodMatcherPage />} />
            <Route path="/my-list" element={<MyListPage />} />
            <Route path="/profile/:username" element={<ProfilePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
