import '../styles/minimal.css'
import {useEffect,useState} from 'react'

export default function App({ Component, pageProps }) {
  const [admin,setAdmin]=useState(false)
  useEffect(()=>{
    if(typeof window==='undefined'||window.location.pathname!=='/')return
    try{
      const s=JSON.parse(localStorage.getItem('recruitment_os_session'))
      const orgId=localStorage.getItem('recruitment_os_active_org')||''
      if(!s?.user?.id||!orgId)return
      fetch('/api/data',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${s.access_token||''}`,'X-Refresh-Token':s.refresh_token||''},body:JSON.stringify({op:'bootstrap',userId:s.user.id,refreshToken:s.refresh_token||''})}).then(r=>r.json()).then(d=>{
        const m=(d.memberships||[]).find(x=>x.organization_id===orgId&&x.is_active)
        setAdmin(m?.role==='hr_admin')
      }).catch(()=>{})
    }catch{}
  },[])
  return <><Component {...pageProps} />{admin&&<a href="/admin-users" className="adminUserShortcut">＋ ساخت کاربر</a>}<style jsx global>{`.adminUserShortcut{position:fixed;left:18px;bottom:18px;z-index:80;background:#6242F5;color:#fff;text-decoration:none;border-radius:11px;padding:10px 14px;font:800 12px Inter,Tahoma,Arial,sans-serif;box-shadow:0 10px 28px rgba(98,66,245,.28)}.adminUserShortcut:hover{transform:translateY(-1px)}`}</style></>
}
