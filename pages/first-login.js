import Head from 'next/head'
import {useState} from 'react'

export default function FirstLogin(){
 const[email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[msg,setMsg]=useState(''),[busy,setBusy]=useState(false)
 async function submit(e){
  e.preventDefault();setMsg('')
  if(password.length<8)return setMsg('رمز باید حداقل ۸ کاراکتر باشد.')
  if(password!==confirm)return setMsg('تکرار رمز با رمز اصلی یکسان نیست.')
  setBusy(true)
  try{
   const r=await fetch('/api/signup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})})
   const o=await r.json()
   if(!r.ok)throw new Error(o.error||'خطا در ساخت حساب')
   if(o.access_token&&o.user){
    const s={access_token:o.access_token,refresh_token:o.refresh_token,user:o.user}
    localStorage.setItem('recruitment_os_session',JSON.stringify(s))
    window.location.href='/'
    return
   }
   setMsg('حساب ساخته شد. ایمیل تأیید را باز کن و بعد با همین رمز وارد ATS شو.')
  }catch(err){setMsg(err.message)}finally{setBusy(false)}
 }
 return <><Head><title>First Login · Recruitment OS</title></Head><div className="page" dir="rtl"><form className="card" onSubmit={submit}><div className="brand">RECRUITMENT OS</div><h1>اولین ورود</h1><p>ایمیلی که HR Admin برایت تعریف کرده وارد کن و رمز خودت را بساز.</p><input type="email" required placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/><input type="password" required placeholder="رمز جدید (حداقل ۸ کاراکتر)" value={password} onChange={e=>setPassword(e.target.value)}/><input type="password" required placeholder="تکرار رمز" value={confirm} onChange={e=>setConfirm(e.target.value)}/><button disabled={busy}>{busy?'در حال ساخت حساب...':'ساخت حساب و ورود'}</button>{msg&&<div className="msg">{msg}</div>}<a href="/">قبلاً حساب ساخته‌ای؟ ورود</a></form></div><style jsx>{`.page{min-height:100vh;display:grid;place-items:center;background:radial-gradient(circle at 20% 20%,#ECE6FF 0,transparent 28%),linear-gradient(135deg,#FBFAFC,#F3F0F7);font-family:Inter,Tahoma,Arial,sans-serif;color:#190023}.card{width:min(430px,92vw);background:#fff;border:1px solid #E9E4ED;border-radius:20px;padding:30px;box-shadow:0 26px 70px rgba(25,0,35,.12)}.brand{font-size:11px;font-weight:900;letter-spacing:.09em;color:#6242F5;margin-bottom:8px}h1{margin:0 0 8px;font-size:25px}p{color:#746D78;font-size:13px;line-height:1.8;margin:0 0 16px}input{width:100%;padding:12px;margin:6px 0;border:1px solid #DCD4E1;border-radius:10px;outline:none;font:inherit}input:focus{border-color:#6242F5;box-shadow:0 0 0 3px rgba(98,66,245,.11)}button{width:100%;margin-top:10px;padding:11px;border:0;border-radius:10px;background:#6242F5;color:#fff;font:inherit;font-weight:800;cursor:pointer}button:disabled{opacity:.65}.msg{margin-top:12px;padding:10px 12px;border-radius:10px;background:#F4F0FF;color:#4F35C8;font-size:12px;line-height:1.7}a{display:block;text-align:center;margin-top:16px;color:#6242F5;font-size:12px;text-decoration:none}`}</style></>
}
