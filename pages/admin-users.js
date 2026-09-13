import Head from 'next/head'
import {useEffect,useState} from 'react'

const ROLES=[['hr_admin','HR Admin'],['hr','HR'],['hiring_manager','Hiring Manager'],['interviewer','Interviewer'],['viewer','Viewer']]

export default function AdminUsers(){
 const[email,setEmail]=useState(''),[password,setPassword]=useState(''),[role,setRole]=useState('viewer'),[session,setSession]=useState(null),[orgId,setOrgId]=useState(''),[msg,setMsg]=useState(''),[busy,setBusy]=useState(false)
 useEffect(()=>{try{const s=JSON.parse(localStorage.getItem('recruitment_os_session'));setSession(s);setOrgId(localStorage.getItem('recruitment_os_active_org')||'')}catch{}},[])
 async function submit(e){
  e.preventDefault();setMsg('')
  if(password.length<8)return setMsg('رمز موقت باید حداقل ۸ کاراکتر باشد.')
  if(!session?.access_token&&!session?.refresh_token)return setMsg('ابتدا با HR Admin وارد ATS شو و شرکت را انتخاب کن.')
  if(!orgId)return setMsg('ابتدا شرکت را در ATS انتخاب کن.')
  const emails=[...new Set(email.split(/[\s,;]+/).map(x=>x.trim().toLowerCase()).filter(Boolean))]
  if(!emails.length)return setMsg('حداقل یک ایمیل وارد کن.')
  setBusy(true)
  try{
   let cur=session,ok=0,failed=[]
   for(const memberEmail of emails){
    const r=await fetch('/api/admin-create-user',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${cur?.access_token||''}`,'X-Refresh-Token':cur?.refresh_token||''},body:JSON.stringify({email:memberEmail,password,role,orgId,refreshToken:cur?.refresh_token||''})})
    const o=await r.json().catch(()=>({}))
    if(o?.session){cur={...cur,...o.session};localStorage.setItem('recruitment_os_session',JSON.stringify(cur));setSession(cur)}
    if(r.ok)ok++
    else failed.push(`${memberEmail}: ${o.error||'خطا'}`)
   }
   setMsg(failed.length?`${ok} کاربر ساخته شد. ${failed.length} مورد ناموفق بود: ${failed.join(' | ')}`:`${ok} کاربر با موفقیت ساخته شد.`)
   if(!failed.length){setEmail('');setPassword('');setRole('viewer')}
  }catch(err){setMsg(err.message)}finally{setBusy(false)}
 }
 return <><Head><title>Create User · Recruitment OS</title></Head><div className="page" dir="rtl"><form className="card" onSubmit={submit}><div className="brand">HR ADMIN</div><div className="head"><div><h1>ساخت کاربر</h1><p>یک ایمیل یا چند ایمیل را خط‌به‌خط وارد کن؛ Role و رمز موقت برای همه اعمال می‌شود.</p></div><a href="/">بازگشت</a></div><label>ایمیل کاربرها</label><textarea required value={email} onChange={e=>setEmail(e.target.value)} placeholder={'user1@company.com\nuser2@company.com'}/><label>Role</label><select value={role} onChange={e=>setRole(e.target.value)}>{ROLES.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select><label>رمز موقت</label><input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="حداقل ۸ کاراکتر"/><div className="hint">اگر Session منقضی شده باشد، سیستم به‌صورت خودکار آن را Refresh می‌کند. کاربرها با همین رمز وارد می‌شوند.</div><button disabled={busy}>{busy?'در حال ساخت...':'Create User(s)'}</button>{msg&&<div className="msg">{msg}</div>}</form></div><style jsx>{`.page{min-height:100vh;display:grid;place-items:center;background:#F8F7F9;font-family:Inter,Tahoma,Arial,sans-serif;color:#190023;padding:20px}.card{width:min(620px,94vw);background:#fff;border:1px solid #E9E4ED;border-radius:20px;padding:28px;box-shadow:0 20px 60px rgba(25,0,35,.1)}.brand{font-size:11px;font-weight:900;letter-spacing:.08em;color:#6242F5;margin-bottom:8px}.head{display:flex;align-items:flex-start;justify-content:space-between;gap:15px}.head a{color:#6242F5;font-size:12px;text-decoration:none}h1{margin:0 0 5px;font-size:25px}p{margin:0 0 20px;color:#746D78;font-size:13px}label{display:block;font-size:12px;font-weight:800;margin:12px 0 6px}input,select,textarea{width:100%;padding:12px;border:1px solid #DCD4E1;border-radius:10px;background:#fff;outline:none;font:inherit;box-sizing:border-box}textarea{min-height:150px;resize:vertical;direction:ltr;text-align:left}input:focus,select:focus,textarea:focus{border-color:#6242F5;box-shadow:0 0 0 3px rgba(98,66,245,.11)}.hint{margin-top:12px;padding:11px 12px;background:#F4F0FF;color:#5132E4;border-radius:10px;font-size:12px;line-height:1.7}button{width:100%;margin-top:14px;border:0;border-radius:10px;padding:12px;background:#6242F5;color:#fff;font:inherit;font-weight:900;cursor:pointer}.msg{margin-top:12px;padding:11px 12px;background:#F8F7F9;border:1px solid #E9E4ED;border-radius:10px;font-size:12px;line-height:1.7;word-break:break-word}`}</style></>
}