import { Link } from 'react-router-dom';

export const UnauthorizedPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500 to-red-400 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">403</h1>
        <h2 className="text-3xl font-bold text-white mb-4">Access Denied</h2>
        <p className="text-white text-lg mb-8">You do not have permission to access this page.</p>
        <Link
          to="/login"
          className="px-8 py-3 bg-white text-red-600 font-bold rounded-lg hover:bg-gray-100 transition"
        >
          Go Back to Login
        </Link>
      </div>
    </div>
  );
};
