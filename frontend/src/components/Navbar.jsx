import { Link } from 'react-router-dom'

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-transparent">
      <div className="flex justify-center items-center px-8 py-6 max-w-full gap-16">
        {/* Left Navigation Items */}
        <ul className="flex gap-12 list-none m-0 p-0 items-center">
          <li className="m-0">
            <a href="#map" className="no-underline text-sm font-semibold tracking-wider transition-opacity duration-300 hover:opacity-80 cursor-pointer text-[#164871]">
              MAP
            </a>
          </li>
          <li className="m-0">
            <a href="#reports" className="no-underline text-sm font-semibold tracking-wider transition-opacity duration-300 hover:opacity-80 cursor-pointer text-[#164871]">
              REPORTS
            </a>
          </li>
        </ul>

        {/* Logo */}
        <Link to="/" className="flex items-center cursor-pointer">
          <img src="/logo.png" alt="WaterPulse Logo" className="h-12 w-auto object-contain" />
        </Link>

        {/* Right Navigation Items */}
        <ul className="flex gap-12 list-none m-0 p-0 items-center">
          <li className="m-0">
            <a href="#profile" className="no-underline text-sm font-semibold tracking-wider transition-opacity duration-300 hover:opacity-80 cursor-pointer text-[#164871]">
              PROFILE
            </a>
          </li>
          <li className="m-0">
            <Link to="/login" className="no-underline text-sm font-semibold tracking-wider transition-opacity duration-300 hover:opacity-80 cursor-pointer text-[#608A9A]">
              LOGIN
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  )
}
