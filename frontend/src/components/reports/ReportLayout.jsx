import React from 'react';

// Generic layout for report-related views.
// SRP: only concerned with layout & theming, not data.
export const ReportLayout = ({ title, subtitle, actions, children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#E7F2F6] to-white">
      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8 animate-report-fade-in">
        <header className="flex flex-col gap-4 mb-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#164871] font-universo tracking-wide">
              {title}
            </h1>
            {subtitle && (
              <p className="max-w-2xl mt-2 text-sm text-gray-700 font-helvetica md:text-base">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex flex-wrap items-center gap-3">
              {actions}
            </div>
          )}
        </header>

        <main className="space-y-6">{children}</main>
      </div>
    </div>
  );
};

export default ReportLayout;
