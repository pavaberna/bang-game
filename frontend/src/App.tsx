import React, { useState } from 'react'
import "./index.css"
import { signup } from './api'

function App() {

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [success, setSuccess] = useState<boolean | null>(null)

  const handleClick = async () => {
    const response = await signup(username, password)
    if (response.success) {
      setSuccess(true)
    } else {
      setSuccess(false)
    }
  }

  return (
    <main className="flex flex-col items-center py-16">
      <section className="card card-body max-w-[300px] bg-primary text-primary-content mb-8">
        <input type="text" className='input input-bordered' value={username} placeholder="username" onChange={(e => setUsername(e.target.value))} />
        <input type="password" className='input input-bordered' value={password} placeholder='*****' onChange={(e => setPassword(e.target.value))} />
        <button className="btn btn-success" onClick={handleClick}>Sign up</button>
      </section>
      {success === true &&
        <section className='alert alert-success flex justify-between max-w-[300px]'>
          Success!!
          <button className='bnt btn-ghost' onClick={() => setSuccess(null)}>Close</button>
        </section>
      }
      {success === false &&
        <section className='alert alert-success flex justify-between max-w-[300px]'>
          Error!!
          <button className='bnt btn-ghost' onClick={() => setSuccess(null)}>Close</button>
        </section>
      }
    </main>
  )
}

export default App
