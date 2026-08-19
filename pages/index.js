import Head from 'next/head'
import { useEffect, useState } from 'react'

export default function Home(){
  const [email,setEmail]=useState('mahdi.jalali.sf@gmail.com')
  const [password,setPassword]=useState('')
  const [msg,setMsg]=useState('')
  const [loading,setLoading]=useState(false)
  const [user,setUser]=useState(null)
  const [profile,setProfile]=useState(null)

  useEffect(()=>{
    try{
      const raw=localStorage.getItem('recruitment_os_session')
      if(raw){const s=JSON.parse(raw); if(s?.user){setUser(s.user);setProfile({full_name:'Mahdi Jalali',role:'hr'})}}
    }catch(e){}
  },[])

  async function login(e){
    e.preventDefault()
    setLoading(true);setMsg('در حال ورود...')
    try{
      const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),15000)
      const res=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email.trim(),password}),signal:controller.signal})
      clearTimeout(timer)
      const out=await res.json().catch(()=>({}))
      if(!res.ok){setMsg(out.error||'خطا در ورود');setLoading(false);return}
      localStorage.setItem('recruitment_os_session',JSON.stringify(out))
      setUser(out.user)
      setProfile({full_name:'Mahdi Jalali',role:'hr'})
      setMsg('')
    }catch(err){setMsg(err.name==='AbortError'?'ارتباط با سرور زمان‌بر شد.':'خطا در ارتباط با سرور')}
    setLoading(false)
  }

  function logout(){localStorage.removeItem('recruitment_os_session');setUser(null);setProfile(null);setPassword('')}

  return <>
    <Head><title>Recruitment OS</title><meta name="viewport" content="width=device-width,initial-scale=1" /></Head>
    <style jsx global>{`*{box-sizing:border-box}body{margin:0;background:#f5f7fb;color:#172033;font-family:Tahoma,Arial,sans-serif}header{height:62px;background:#101828;color:white;display:flex;align-items:center;justify-content:space-between;padding:0 18px}.brand{font-size:22px;font-weight:800}.wrap{min-height:calc(100vh - 62px);display:flex;align-items:flex-start;justify-content:center;padding-top:105px}.card{width:min(460px,92vw);background:white;border:1px solid #e4e7ec;border-radius:16px;padding:26px;box-shadow:0 8px 30px #00000008}h1{font-size:28px;margin:0 0 14px}p{color:#667085;line-height:1.8;font-size:13px}input{width:100%;height:45px;border:1px solid #d0d5dd;border-radius:9px;padding:0 12px;font-size:15px;margin:8px 0}button{border:0;border-radius:9px;padding:11px 17px;cursor:pointer;font-size:15px}.primary{background:#635bff;color:white}.secondary{background:#f2f4f7}.msg{margin-top:12px;color:#475467}.dashboard{width:min(1100px,94vw);background:white;border:1px solid #e4e7ec;border-radius:16px;padding:22px}.tabs{display:flex;gap:8px;margin:18px 0}.tab{background:#eef2ff;color:#3730a3}.status{display:inline-block;background:#dcfae6;color:#067647;padding:5px 9px;border-radius:999px;font-size:12px}`}</style>
    <header><div className="brand">Recruitment OS</div>{user&&<button className="secondary" onClick={logout}>Logout</button>}</header>
    <main className="wrap">
      {!user?<form className="card" onSubmit={login} dir="rtl">
        <h1>ورود به ATS</h1><p>با حساب HR وارد سیستم شو.</p>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="Email" />
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} placeholder="Password" />
        <div style={{display:'flex',gap:8,marginTop:12}}><button className="primary" type="submit" disabled={loading}>{loading?'در حال ورود...':'Login'}</button></div>
        {msg&&<div className="msg">{msg}</div>}
      </form>:
      <section className="dashboard" dir="rtl">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}><div><h1 style={{marginBottom:4}}>Recruitment OS</h1><p style={{margin:0}}>خوش آمدی، {profile?.full_name||user.email}</p></div><span className="status">HR</span></div>
        <div className="tabs"><button className="tab">Hiring Requests</button><button className="tab">Jobs</button><button className="tab">Automations / Settings</button></div>
        <div style={{background:'#f8fafc',border:'1px solid #e4e7ec',borderRadius:12,padding:18}}><b>ورود با موفقیت انجام شد.</b><p>در مرحله بعد برد جذب، Hiring Request، Candidate Screening و Stage Actions را روی همین نسخه Native Next.js منتقل می‌کنیم.</p></div>
      </section>}
    </main>
  </>
}