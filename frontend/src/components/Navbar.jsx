import { Link } from 'react-router-dom'

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 z-50 w-full bg-transparent">
      <div className="flex items-center justify-center max-w-full gap-16 px-8 py-6">
        {/* Left Navigation Items */}
        <ul className="flex items-center gap-12 p-0 m-0 list-none">
          <li className="m-0">
            <Link
              to="/map"
              className="no-underline text-sm font-semibold tracking-wider transition-opacity duration-300 hover:opacity-80 cursor-pointer text-[#164871]"
            >
              MAP
            </Link>
          </li>
          <li className="m-0">
            <Link to="/reports" className="no-underline text-sm font-semibold tracking-wider transition-opacity duration-300 hover:opacity-80 cursor-pointer text-[#164871]">
              REPORTS
            </Link>
          </li>
        </ul>

        {/* Logo */}
        <Link to="/" className="flex items-center cursor-pointer">
          <img src="/logo.png" alt="WaterPulse Logo" className="object-contain w-auto h-12" />
        </Link>

        {/* Right Navigation Items */}
        <ul className="flex items-center gap-12 p-0 m-0 list-none">
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
