import Head from 'next/head'
import {useEffect,useState} from 'react'

const ROLES=[['hr_admin','HR Admin'],['hr','HR'],['hiring_manager','Hiring Manager'],['interviewer','Interviewer'],['viewer','Viewer']]

export default function AdminUsers(){
 const[email,setEmail]=useState(''),[password,setPassword]=useState(''),[role,setRole]=useState('viewer'),[session,setSession]=useState(null),[orgId,setOrgId]=useState(''),[msg,setMsg]=useState(''),[busy,setBusy]=useState(false)
 useEffect(()=>{try{const s=JSON.parse(localStorage.getItem('recruitment_os_session'));setSession(s);setOrgId(localStorage.getItem('recruitment_os_active_org')||'')}catch{}},[])
 async function submit(e){
  e.preventDefault();setMsg('')
  if(password.length<8)return setMsg('رمز موقت باید حداقل ۸ کاراکتر باشد.')
  if(!session?.access_token||!orgId)return setMsg('ابتدا با HR Admin وارد ATS شو و شرکت را انتخاب کن.')
  setBusy(true)
  try{
   const r=await fetch('/api/admin-create-user',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({email,password,role,orgId})})
   const o=await r.json().catch(()=>({}))
   if(!r.ok)throw new Error(o.error||'ساخت کاربر انجام نشد')
   setMsg('کاربر ساخته شد. رمز موقت را برای او بفرست؛ در اولین ورود مجبور است آن را تغییر دهد.')
   setEmail('');setPassword('');setRole('viewer')
  }catch(err){setMsg(err.message)}finally{setBusy(false)}
 }
 return <><Head><title>Create User · Recruitment OS</title></Head><div className="page" dir="rtl"><form className="card" onSubmit={submit}><div className="brand">HR ADMIN</div><div className="head"><div><h1>ساخت کاربر</h1><p>ایمیل، Role و رمز موقت را خودت تعریف کن.</p></div><a href="/">بازگشت</a></div><label>ایمیل کاربر</label><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="user@company.com"/><label>Role</label><select value={role} onChange={e=>setRole(e.target.value)}>{ROLES.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select><label>رمز موقت</label><input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="حداقل ۸ کاراکتر"/><div className="hint">کاربر با این رمز فقط می‌تواند مرحله تغییر رمز را انجام دهد و تا ساخت رمز جدید وارد ATS نمی‌شود.</div><button disabled={busy}>{busy?'در حال ساخت...':'Create User'}</button>{msg&&<div className="msg">{msg}</div>}<div className="foot">لینک تغییر رمز برای کاربر: <b>/first-login</b></div></form></div><style jsx>{`.page{min-height:100vh;display:grid;place-items:center;background:#F8F7F9;font-family:Inter,Tahoma,Arial,sans-serif;color:#190023;padding:20px}.card{width:min(500px,94vw);background:#fff;border:1px solid #E9E4ED;border-radius:20px;padding:28px;box-shadow:0 20px 60px rgba(25,0,35,.1)}.brand{font-size:11px;font-weight:900;letter-spacing:.08em;color:#6242F5;margin-bottom:8px}.head{display:flex;align-items:flex-start;justify-content:space-between;gap:15px}.head a{color:#6242F5;font-size:12px;text-decoration:none}h1{margin:0 0 5px;font-size:25px}p{margin:0 0 20px;color:#746D78;font-size:13px}label{display:block;font-size:12px;font-weight:800;margin:12px 0 6px}input,select{width:100%;padding:12px;border:1px solid #DCD4E1;border-radius:10px;background:#fff;outline:none;font:inherit}input:focus,select:focus{border-color:#6242F5;box-shadow:0 0 0 3px rgba(98,66,245,.11)}.hint{margin-top:12px;padding:11px 12px;background:#F4F0FF;color:#5132E4;border-radius:10px;font-size:12px;line-height:1.7}button{width:100%;margin-top:14px;border:0;border-radius:10px;padding:12px;background:#6242F5;color:#fff;font:inherit;font-weight:900;cursor:pointer}.msg{margin-top:12px;padding:11px 12px;background:#F8F7F9;border:1px solid #E9E4ED;border-radius:10px;font-size:12px;line-height:1.7}.foot{margin-top:16px;color:#746D78;font-size:11px}`}</style></>
}
