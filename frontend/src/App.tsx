import { FormEvent, useState } from 'react'

function App() {
  const [username, setUsername] = useState('username@659')
  const [password, setPassword] = useState('password')
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#efedf1] text-[#454545]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-[40vw] w-[70vw] min-h-[220px] min-w-[320px] max-h-[420px] max-w-[620px] rounded-full bg-gradient-to-r from-[#ffb36b] via-[#ff625f] to-[#ff728f] blur-2xl" />
        <div className="absolute left-[4%] top-[58%] h-[34vw] w-[36vw] min-h-[180px] min-w-[190px] max-h-[320px] max-w-[360px] rounded-full bg-[#ffd7d5] opacity-90 blur-[70px] sm:left-[9%] sm:top-[48%]" />
        <div className="absolute right-[3%] top-[18%] h-[32vw] w-[34vw] min-h-[170px] min-w-[180px] max-h-[320px] max-w-[340px] rounded-full bg-[#ffcfd8] opacity-80 blur-[80px] sm:right-[8%] sm:top-[20%]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-start justify-center px-4 pb-8 pt-6 sm:px-6 sm:pt-8 md:items-center md:pb-10 lg:px-8">
        <div className="absolute left-4 top-6 sm:left-6 sm:top-8 md:left-8">
          <svg viewBox="0 0 96 96" className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20" fill="none" aria-hidden="true">
            <rect x="6" y="6" width="84" height="84" rx="14" stroke="#1f2933" strokeWidth="4" />
            <path d="M6 64h84" stroke="#1f2933" strokeWidth="4" />
            <path d="M6 64c0 14 10 26 24 26h60" stroke="#1f2933" strokeWidth="4" />
          </svg>
        </div>

        <section className="mx-auto mt-16 w-full max-w-[680px] rounded-[18px] bg-[#f3f3f4] px-5 py-7 shadow-[0_8px_28px_rgba(23,23,23,0.12)] sm:mt-12 sm:px-8 sm:py-10 md:mt-0 md:rounded-2xl md:px-16 md:py-14 lg:px-20 lg:py-16">
          <header className="text-center">
            <h1 className="text-[clamp(2rem,7vw,4.2rem)] font-medium tracking-tight text-[#4a4a4a]">BookStop</h1>
            <p className="mt-4 text-[clamp(1.1rem,3.8vw,2rem)] font-medium text-[#444] sm:mt-5 md:mt-6">Welcome Back !</p>
            <p className="mt-2 text-[clamp(0.86rem,2.8vw,1.75rem)] text-[#a0a0a0] sm:mt-3">Sign in to continue to yourDigital Library</p>
          </header>

          <form className="mt-8 space-y-5 sm:mt-10 sm:space-y-6 md:mt-12 md:space-y-8" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="mb-2 block text-sm font-medium text-[#454545] sm:mb-3 sm:text-base md:text-xl">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="h-11 w-full rounded-xl border border-[#d9d9d9] bg-[#f6f6f7] px-4 text-sm text-[#555] outline-none transition focus:border-[#ef7a56] focus:ring-2 focus:ring-[#ef7a56]/20 sm:h-12 sm:px-5 sm:text-base md:h-14 md:text-xl"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-[#454545] sm:mb-3 sm:text-base md:text-xl">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-11 w-full rounded-xl border border-[#d9d9d9] bg-[#f6f6f7] px-4 pr-12 text-sm text-[#555] outline-none transition focus:border-[#ef7a56] focus:ring-2 focus:ring-[#ef7a56]/20 sm:h-12 sm:px-5 sm:pr-14 sm:text-base md:h-14 md:text-xl"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#6b7280] sm:right-4"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 12c2.2-3.6 5.5-5.4 10-5.4S19.8 8.4 22 12c-2.2 3.6-5.5 5.4-10 5.4S4.2 15.6 2 12Z" />
                    <circle cx="12" cy="12" r="3" />
                    {!showPassword && <path d="M3 3l18 18" />}
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 text-sm text-[#555] min-[460px]:flex-row min-[460px]:items-center min-[460px]:justify-between sm:text-base md:text-xl">
              <label className="flex items-center gap-2 sm:gap-3">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 accent-[#ef7a56] sm:h-5 sm:w-5"
                />
                <span>Remember me</span>
              </label>
              <a href="#" className="underline decoration-1 underline-offset-2 hover:text-[#2f2f2f]">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="h-11 w-full rounded-xl bg-[#ef7a56] text-sm font-semibold text-white transition hover:bg-[#e86f49] sm:h-12 sm:text-base md:h-14 md:text-xl"
            >
              Login
            </button>
          </form>

          <p className="mt-8 text-sm text-[#555] sm:mt-10 sm:text-base md:mt-12 md:text-xl">
            New User?{' '}
            <a href="#" className="underline decoration-1 underline-offset-2 hover:text-[#2f2f2f]">
              Register Here
            </a>
          </p>
        </section>
      </div>
    </main>
  )
}

export default App
