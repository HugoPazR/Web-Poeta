import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import PoemPage from './pages/PoemPage';
import AdminPage from './pages/AdminPage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import ScrollToTop from './components/ScrollToTop';
import { AuthProvider } from './context/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col bg-parchment">
          <Header />
          <div className="flex-1 w-full">
            <div className="w-full max-w-8xl mx-auto page-padding">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/poema/:id" element={<PoemPage />} />
              <Route path="/sobre-mi" element={<AboutPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/registro" element={<RegisterPage />} />
              <Route path="/perfil" element={<ProfilePage />} />
            </Routes>
            </div>
          </div>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
