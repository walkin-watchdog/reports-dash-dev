import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../store/slices/authSlice';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { analytics } from '../utils/analytics';

interface LogoutButtonProps {
  isMobile?: boolean;
}

const LogoutButton = ({ isMobile = false }: LogoutButtonProps) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    analytics.trackEvent('Auth', 'Logout');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('selectedHotel');
    dispatch(logout());
    navigate('/login');
  };

  if (isMobile) {
    return (
      <button
        onClick={handleLogout}
        className="flex items-center justify-center p-2 text-white hover:bg-zinc-700 transition-colors rounded-md"
        title="Logout"
      >
        <ArrowRightOnRectangleIcon className="h-5 w-5" />
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center justify-center px-4 py-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-md transition-colors w-full"
    >
      <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
      <span>Logout</span>
    </button>
  );
};

export default LogoutButton;