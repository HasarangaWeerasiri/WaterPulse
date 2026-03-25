import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    city: '',
    district: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const { confirmPassword, ...registrationData } = formData;
      await register(registrationData);
      // Small delay to allow state to update
      setTimeout(() => {
        navigate('/home');
      }, 100);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-6rem)] w-full overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#0f2a4a] to-[#0d3d6b]" />
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#2d8bba]/25 blur-3xl" />
      <div className="absolute -bottom-40 -left-32 w-96 h-96 rounded-full bg-cyan-300/15 blur-3xl" />

      <div className="relative h-full max-w-6xl mx-auto flex flex-col lg:flex-row">
        {/* Left hero */}
        <aside className="lg:w-5/12 p-10 flex flex-col justify-center text-white">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 mb-5 w-fit">
            <span className="w-2 h-2 rounded-full bg-[#4ade80]" />
            <span className="text-xs font-semibold tracking-widest uppercase text-white/70">WaterPulse</span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-black leading-tight">
            Create an account.
            <br />
            <span className="text-[#67e8f9]">Protect your zone.</span>
          </h1>

          <p className="mt-4 text-white/70 max-w-md">
            Register to submit water incidents, view local updates, and keep your community informed.
          </p>

          <div className="mt-10 space-y-4">
            <div className="flex gap-3 items-start">
              <div className="mt-0.5 w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 2s7 7 7 12a7 7 0 1 1-14 0c0-5 7-12 7-12Z" stroke="rgba(103,232,249,0.95)" strokeWidth="1.8" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-white">Faster reporting</div>
                <div className="text-sm text-white/65">Your location helps route updates to the right team.</div>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="mt-0.5 w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 2l8 4v6c0 5-3.4 9.7-8 10-4.6-.3-8-5-8-10V6l8-4Z" stroke="rgba(103,232,249,0.95)" strokeWidth="1.8" />
                  <path d="M9 12l2 2 4-5" stroke="rgba(103,232,249,0.95)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-white">Secure sign-up</div>
                <div className="text-sm text-white/65">Authentication keeps your dashboard protected.</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Right form */}
        <main className="flex-1 p-6 sm:p-10 flex items-center justify-center">
          <div className="w-full bg-white/95 backdrop-blur rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-10">
            <div className="mb-7">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-3xl font-black text-[#0a1628]">Create Account</h2>
                  <p className="mt-1 text-sm text-[#0e2233]/70">Join WaterPulse as a citizen</p>
                </div>
                <div className="px-3 py-1 rounded-full bg-[#deedf7] border border-[#b2cfe8] text-[#164871] font-semibold text-xs">
                  Setup your profile
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 mb-5 border border-red-200 rounded-xl bg-red-50">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[#0e2233]/80">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 transition border border-[#cddae6] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d8bba] focus:border-transparent"
                    placeholder="John"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[#0e2233]/80">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 transition border border-[#cddae6] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d8bba] focus:border-transparent"
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#0e2233]/80">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 transition border border-[#cddae6] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d8bba] focus:border-transparent"
                  placeholder="you@example.com"
                  required
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#0e2233]/80">Phone Number</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 transition border border-[#cddae6] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d8bba] focus:border-transparent"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              {/* Location Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[#0e2233]/80">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 transition border border-[#cddae6] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d8bba] focus:border-transparent"
                    placeholder="New York"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[#0e2233]/80">District</label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 transition border border-[#cddae6] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d8bba] focus:border-transparent"
                    placeholder="Manhattan"
                  />
                </div>
              </div>

              {/* Password Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[#0e2233]/80">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 transition border border-[#cddae6] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d8bba] focus:border-transparent"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[#0e2233]/80">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 transition border border-[#cddae6] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d8bba] focus:border-transparent"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 font-semibold text-white transition bg-[#2d8bba] rounded-xl hover:bg-[#3aa2cf] disabled:bg-gray-400 disabled:cursor-not-allowed mt-4"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>

              <div className="pt-2 flex items-center justify-between gap-4 flex-wrap">
                <div className="text-sm text-[#0e2233]/70">
                  Already have an account?
                </div>
                <Link to="/login" className="text-sm font-semibold text-[#2d8bba] hover:underline">
                  Sign In →
                </Link>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};
