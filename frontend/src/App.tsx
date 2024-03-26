import { useState } from 'react'
import "./index.css"
import { signup, login, createGame } from './api'

function App() {

  const [name, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [signupSuccess, setSignupSuccess] = useState<boolean | null>(null)
  const [loginSuccess, setLoginSuccess] = useState<boolean | null>(null)

  const handleSignup = async () => {
    const response = await signup(name, password)
    if (response.success) {
      setSignupSuccess(true)
    } else {
      setSignupSuccess(false)
    }
  }

  const handleLogin = async () => {
    const response = await login(name, password)
    if (response.success) {
      setLoginSuccess(true)
      localStorage.setItem("token", response.data.token)
    } else {
      setLoginSuccess(false)
    }
  }

  const handleCreate = async () => {
    const response = await login(name, password)

  }


  return (
    <>
      {loginSuccess !== true ? (
        <main className="flex flex-col items-center py-16">
          <section className="card card-body max-w-[300px] bg-primary text-primary-content mb-8">
            <input type="text" className='input input-bordered' value={name} placeholder="username" onChange={(e => setUsername(e.target.value))} />
            <input type="password" className='input input-bordered' value={password} placeholder='*****' onChange={(e => setPassword(e.target.value))} />
            <button className="btn btn-success" onClick={handleSignup}>Sign up</button>
            <button className="btn btn-success" onClick={handleLogin}>Login</button>
          </section>

          {signupSuccess === true &&
            <section className='alert alert-success flex justify-between max-w-[300px]'>
              Success!!
              <button className='bnt btn-ghost' onClick={() => setSignupSuccess(null)}>Close</button>
            </section>
          }
          {signupSuccess === false &&
            <section className='alert alert-error flex justify-between max-w-[300px]'>
              Error!!
              <button className='bnt btn-ghost' onClick={() => setSignupSuccess(null)}>Close</button>
            </section>
          }
        </main>
      ) : (
        <main className="flex flex-col items-center py-16">
          <section className='alert alert-success flex justify-between max-w-[300px]'>
            Success!!
            <button className='bnt btn-ghost' onClick={() => setLoginSuccess(null)}>Close</button>
          </section>
          <button className='bnt btn-ghost'>Logout</button>
        </main >
      )
      }
    </>
  )
}

export default App
