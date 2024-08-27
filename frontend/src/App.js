import { Routes, Route } from 'react-router-dom'
import LandingPageLayout from './components/layouts/LandingPageLayout';
import HomePageLayout from './components/layouts/HomePageLayout'
import Landing from './pages/everyone/Landing';
import SignIn from './pages/everyone/SignIn';
import SignUp from './pages/everyone/SignUp';
import HomePage from './pages/user/HomePage';
import ForgotPwd from './pages/everyone/ForgotPwd'
import ResetPwd from './pages/everyone/ResetPwd'
import WatchHistory from './pages/user/WatchHistory';
import WatchLater from './pages/user/WatchLater';
import Subscriptions from './pages/user/Subscriptions';
import MySubscriptions from './pages/user/MySubscriptions';
import Movie from './pages/user/Movie';
import PaymentPage from './pages/user/PaymentPage';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoutes from './auth/ProtectedRoutes'
import 'bootstrap/dist/css/bootstrap.min.css';
import './stylesheets/Landing.css';
import './stylesheets/Homepage.css';


function App() {
  return (
    <AuthProvider>
      <Routes>

        <Route path='/' element={<LandingPageLayout />}>
          <Route index element={<Landing />} />
          <Route path='login' element={<SignIn />} />
          <Route path='register' element={<SignUp />} />
          <Route path='forgot-pwd' element={<ForgotPwd />} />
          <Route path='/email/reset-pwd/:userId/:userToken' element={<ResetPwd />} />

          {/* Authenticated Routes */}
          <Route path='/home' element={<ProtectedRoutes element={<HomePageLayout />} />}>
            <Route index element={<HomePage />} />
            <Route path='my-subscriptions' element={<MySubscriptions />} />
            <Route path='subscriptions' element={<Subscriptions />} />
            <Route path='watch-later' element={<WatchLater />} />
            <Route path='watch-history' element={<WatchHistory />} />
            <Route path='movie' element={<Movie />} />
            <Route path='payment' element={<PaymentPage />} />
            <Route path='reset-pwd' element={<ResetPwd />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
