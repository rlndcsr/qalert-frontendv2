import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F8FAFF] font-sans">
      {/* Header */}
      <header className="bg-white px-8 py-6">
        <div className="flex items-center gap-3">
          <Image
            src="/images/qalert-icon.png"
            alt="QAlert Logo"
            width={40}
            height={40}
            priority
          />
          <div>
            <h1 className="text-2xl font-bold text-[#25323A]">QAlert</h1>
            <p className="text-sm text-[#6C757D]">
              Digital Queue & Notification System
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center px-8 py-16">
        {/* Initiative Label */}
        <div className="inline-flex items-center px-4 py-2 border border-[#4ad294] rounded-full text-[#4ad294] text-sm font-medium mb-6">
          CSU-UCHW Digital Health Initiative
        </div>

        {/* Slogan */}
        <h2 className="text-4xl md:text-5xl font-bold text-[#25323A] text-center mb-6 leading-tight">
          Skip the Wait,
          <br />
          Get Notified Instead
        </h2>

        {/* Description */}
        <p className="text-lg text-[#25323A] text-center max-w-2xl mb-16 leading-relaxed">
          QAlert modernizes the clinic experience at Caraga State University's
          University Center for Health and Wellness. Register online, monitor
          your queue position in real-time, and receive SMS notifications when
          it's your turn.
        </p>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
          {/* Patient Portal Card */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 hover:border-[#a8e6c3] transition-colors duration-300">
            <div className="w-10 h-10 bg-white border-2 border-[#a8e6c3] rounded-md flex items-center justify-center mb-3">
              <Image
                src="/icons/users.png"
                alt="Users Icon"
                width={20}
                height={20}
              />
            </div>
            <h3 className="text-xl font-bold text-[#25323A] mb-4">
              Patient Portal
            </h3>
            <p className="text-[#6C757D] mb-6">
              Register, join queue, and track your position in real-time
            </p>
            <button className="w-full bg-[#4ad294] text-white font-medium py-2 px-4 rounded-lg hover:bg-[#3bb882] transition-colors text-sm hover:cursor-pointer">
              Enter as Patient
            </button>
          </div>

          {/* Staff Dashboard Card */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 hover:border-[#80cbc4] transition-colors duration-300">
            <div className="w-10 h-10 bg-white border-2 border-[#80cbc4] rounded-md flex items-center justify-center mb-3">
              <Image
                src="/icons/staff-dashboard.png"
                alt="Staff Dashboard Icon"
                width={20}
                height={20}
              />
            </div>
            <h3 className="text-xl font-bold text-[#25323A] mb-4">
              Staff Dashboard
            </h3>
            <p className="text-[#6C757D] mb-6">
              Manage patient queues and track clinic operations
            </p>
            <button className="w-full bg-[#00968a] text-white font-medium py-2 px-4 rounded-lg hover:bg-[#007a6e] transition-colors text-sm hover:cursor-pointer">
              Staff Login
            </button>
          </div>

          {/* Queue Display Card */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 hover:border-[#c8a2f0] transition-colors duration-300">
            <div className="w-10 h-10 bg-white border-2 border-[#c8a2f0] rounded-md flex items-center justify-center mb-3">
              <Image
                src="/icons/computer.png"
                alt="Computer Icon"
                width={20}
                height={20}
              />
            </div>
            <h3 className="text-xl font-bold text-[#25323A] mb-4">
              Queue Display
            </h3>
            <p className="text-[#6C757D] mb-6">
              Public display for clinic waiting room
            </p>
            <button className="mt-6 w-full bg-[#9611f8] text-white font-medium py-2 px-4 rounded-lg hover:bg-[#7e0dd4] transition-colors text-sm hover:cursor-pointer">
              View Display
            </button>
          </div>
        </div>

        {/* Key Features Section */}
        <section className="mt-24 max-w-6xl w-full">
          <h2 className="text-3xl font-bold text-[#25323A] text-center mb-12">
            Key Features
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* SMS Notifications */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#a8e6c3] rounded-md flex items-center justify-center flex-shrink-0">
                <Image
                  src="/icons/sms-notification.png"
                  alt="SMS Notification Icon"
                  width={24}
                  height={24}
                />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#25323A] mb-2">
                  SMS Notifications
                </h3>
                <p className="text-[#6C757D]">
                  Get notified via SMS when your turn is approaching. No need to
                  wait at the clinic.
                </p>
              </div>
            </div>

            {/* Real-Time Updates */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#a8e6c3] rounded-md flex items-center justify-center flex-shrink-0">
                <Image
                  src="/icons/users.png"
                  alt="Users Icon"
                  width={24}
                  height={24}
                />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#25323A] mb-2">
                  Real-Time Updates
                </h3>
                <p className="text-[#6C757D]">
                  Monitor your queue position live through the web dashboard
                  with automatic updates.
                </p>
              </div>
            </div>

            {/* Easy Registration */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#a8e6c3] rounded-md flex items-center justify-center flex-shrink-0">
                <Image
                  src="/icons/staff-dashboard-feature.png"
                  alt="Staff Dashboard Feature Icon"
                  width={24}
                  height={24}
                />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#25323A] mb-2">
                  Easy Registration
                </h3>
                <p className="text-[#6C757D]">
                  Quick sign-up using your university ID and phone number. No
                  complicated forms.
                </p>
              </div>
            </div>

            {/* Staff Management */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#a8e6c3] rounded-md flex items-center justify-center flex-shrink-0">
                <Image
                  src="/icons/computer-feature.png"
                  alt="Computer Feature Icon"
                  width={24}
                  height={24}
                />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#25323A] mb-2">
                  Staff Management
                </h3>
                <p className="text-[#6C757D]">
                  Clinic staff can efficiently manage patient flow and reduce
                  overcrowding.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-10 bg-white border-t border-gray-200 py-8">
        <div className="text-center">
          <p className="text-[#6C757D] text-sm">
            ©2025 QAlert - Caraga State University University Center for Health
            and Wellness
          </p>
        </div>
      </footer>
    </div>
  );
}
