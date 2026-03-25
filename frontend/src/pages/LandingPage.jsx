import { useNavigate } from 'react-router-dom'

export const LandingPage = () => {
  const navigate = useNavigate()

  const handleGetStarted = () => {
    navigate('/register')
  }

  return (
    <div className="relative flex items-center justify-center w-full min-h-screen overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-center bg-no-repeat bg-cover"
        style={{ backgroundImage: "url('/bg.jpg')" }}
      />

      {/* Content Container */}
      <div className="relative z-10 w-full h-full flex items-center px-8 mt-[200px]">
        <div className="flex flex-col max-w-3xl gap-8 ml-12">
          {/* Main Header */}
          <h1 className="text-5xl font-black leading-none tracking-tight text-left text-white md:text-5xl font-universo">
            Keeping<br />
            Our Community’s Water<br />
            Pure.
          </h1>

          {/* Subheading */}
          <p className="max-w-2xl font-normal leading-relaxed text-left text-white text-md font-helvetica">
            We're working together to keep our community's water safe. Report<br />
            concerns in your area and get instant updates directly to your phone.
          </p>

          {/* CTA Button */}
          <button 
            onClick={handleGetStarted}
            className="flex items-center gap-3 px-5 py-2 text-lg font-semibold text-[#4B98AF] bg-transparent border-2 border-[#4B98AF] rounded-3xl transition-all duration-300 hover:bg-[rgba(75,152,175,0.1)] hover:translate-x-1 active:translate-x-0.5 w-fit font-helvetica" 
          >
            <span className="tracking-wide">Get Started</span>
            <img src="/arrow.png" alt="arrow" className="object-contain w-auto h-5 ml-8" />
          </button>
        </div>
      </div>
    </div>
  )
}
