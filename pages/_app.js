import '../styles/minimal.css'
import {useEffect,useState} from 'react'

const ROLES=[['hr_admin','HR Admin'],['hr','HR'],['hiring_manager','Hiring Manager'],['interviewer','Interviewer'],['viewer','Viewer']]

export default function App({ Component, pageProps }) {
  const [orgId,setOrgId]=useState('')
  const [session,setSession]=useState(null)
  const [showAdminUsers,setShowAdminUsers]=useState(false)

  useEffect(()=>{
    if(typeof window==='undefined')return
    const syncLocal=()=>{
      try{
        const raw=localStorage.getItem('recruitment_os_session')
        setSession(raw?JSON.parse(raw):null)
        setOrgId(localStorage.getItem('recruitment_os_active_org')||'')
      }catch{}
    }
    const detectActive=()=>{
      const active=document.querySelector('.navBtn.active')
      setShowAdminUsers(!!active && (active.textContent||'').includes('HR Admin'))
    }
    syncLocal()
    setTimeout(detectActive,0)
    const onStorage=()=>syncLocal()
    const onClick=e=>{
      const btn=e.target?.closest?.('.navBtn')
      if(!btn)return
      setShowAdminUsers((btn.textContent||'').includes('HR Admin'))
      syncLocal()
    }
    window.addEventListener('storage',onStorage)
    document.addEventListener('click',onClick)
    return()=>{
      window.removeEventListener('storage',onStorage)
      document.removeEventListener('click',onClick)
    }
  },[])

  return <>
    <Component {...pageProps} />
    {showAdminUsers&&session?.user?.id&&orgId&&<div className="adminUsersDock"><AdminUsersInline session={session} orgId={orgId}/></div>}
    <style jsx global>{`
      .content>.pageHead+.pageHead{display:none!important}
      .adminGrid>.section:nth-child(2){display:none!important}
      .adminUsersDock{position:absolute;z-index:4;left:26px;right:242px;top:420px}
      .adminUsersDock .adminEnhancedSection{width:100%!important;margin:0!important;padding:20px!important}
      .adminEnhancedSection>.row{margin-bottom:18px}
      .adminEnhancedSection>.row h3{font-size:15px!important;margin:0!important}
      .adminEnhancedSection .userCreateRow{display:grid;grid-template-columns:minmax(240px,1.55fr) minmax(170px,.8fr) minmax(240px,1.15fr) 140px;gap:12px;align-items:end;margin-bottom:10px}
      .adminEnhancedSection .fieldGroup{display:flex;flex-direction:column;gap:6px;min-width:0}
      .adminEnhancedSection .fieldGroup span{font-size:11px;font-weight:700;color:#746d78}
      .adminEnhancedSection .userCreateRow input,.adminEnhancedSection .userCreateRow select{min-width:0;width:100%;height:42px;padding:10px 12px!important;border-radius:10px!important}
      .adminEnhancedSection .userCreateRow .primary{width:140px;height:42px;padding:8px 12px;line-height:1.15}
      .adminEnhancedSection .userHelp{font-size:11px;color:#746d78;margin:0 0 16px;line-height:1.6}
      .adminEnhancedSection .memberEnhanced{display:grid;grid-template-columns:minmax(260px,1.4fr) 190px 100px 130px;gap:14px;align-items:center;padding:14px 0;border-top:1px solid #eee9f1}
      .adminEnhancedSection .memberEnhanced select{width:100%;height:38px;padding:7px 9px}
      .adminEnhancedSection .memberEnhanced .deleteUser{background:#fff0f3!important;color:#ed1944!important;border:1px solid #ffd9e1!important;border-radius:9px!important;padding:8px 11px!important;font-weight:800!important;cursor:pointer;min-height:38px}
      .adminEnhancedSection .memberEnhanced .deleteUser:disabled{opacity:.45;cursor:not-allowed}
      .adminEnhancedSection .memberEnhanced label{display:flex;gap:7px;align-items:center;white-space:nowrap;justify-content:center}
      .adminEnhancedSection .successMsg{background:#ecfff7;color:#087a4f;border:1px solid #ccefe1;border-radius:10px;padding:10px 12px;margin-bottom:12px;font-size:12px}
      .adminEnhancedSection .errorMsg{background:#fff3f5;color:#b21639;border:1px solid #ffd7df;border-radius:10px;padding:10px 12px;margin-bottom:12px;font-size:12px}
      @media(max-width:1150px){.adminUsersDock{left:18px;right:234px;top:440px}.adminEnhancedSection .userCreateRow{grid-template-columns:1fr 1fr}.adminEnhancedSection .userCreateRow .primary{width:100%}.adminEnhancedSection .memberEnhanced{grid-template-columns:1fr 160px 90px 115px}}
      @media(max-width:850px){.adminUsersDock{position:relative;left:auto;right:auto;top:auto;margin:18px}.adminEnhancedSection .userCreateRow,.adminEnhancedSection .memberEnhanced{grid-template-columns:1fr}.adminEnhancedSection .memberEnhanced label{justify-content:flex-start}}
    `}</style>
  </>
}

function AdminUsersInline({session,orgId}){
  const[email,setEmail]=useState(''),[password,setPassword]=useState(''),[role,setRole]=useState('viewer'),[members,setMembers]=useState([]),[busy,setBusy]=useState(false),[msg,setMsg]=useState(''),[ok,setOk]=useState(false)

  async function callData(op,payload={}){
    const r=await fetch('/api/data',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session?.access_token||''}`,'X-Refresh-Token':session?.refresh_token||''},body:JSON.stringify({op,userId:session?.user?.id,refreshToken:session?.refresh_token||'',orgId,...payload})})
    const d=await r.json().catch(()=>({}))
    if(!r.ok)throw new Error(d.error||'Request failed')
    return d
  }

  async function load(){
    if(!session?.user?.id||!orgId)return
    try{const d=await callData('list_members');setMembers(d.members||[])}catch(e){setOk(false);setMsg(e.message)}
  }
  useEffect(()=>{load()},[session?.user?.id,orgId])

  async function createUser(){
    setMsg('');setOk(false)
    const cleanEmail=email.trim().toLowerCase()
    if(!cleanEmail)return setMsg('Email is required.')
    if(password.length<8)return setMsg('Temporary password must be at least 8 characters.')
    setBusy(true)
    try{
      const r=await fetch('/api/admin-create-user',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session?.access_token||''}`},body:JSON.stringify({email:cleanEmail,password,role,orgId})})
      const d=await r.json().catch(()=>({}))
      if(!r.ok)throw new Error(d.error||'Could not create user')
      setEmail('');setPassword('');setRole('viewer');setOk(true);setMsg('User created successfully. Temporary password is active and must be changed on first login.');await load()
    }catch(e){setOk(false);setMsg(e.message)}finally{setBusy(false)}
  }

  async function updateMember(m,patch){
    setBusy(true);setMsg('');setOk(false)
    try{await callData('update_member',{memberUser:m.user_id,role:patch.role??m.role,isActive:patch.is_active??m.is_active});await load()}catch(e){setMsg(e.message)}finally{setBusy(false)}
  }

  async function removeMember(m){
    if(m.user_id===session?.user?.id)return
    if(!window.confirm(`Remove ${m.email} from this company?`))return
    setBusy(true);setMsg('');setOk(false)
    try{
      const r=await fetch('/api/admin-remove-user',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session?.access_token||''}`},body:JSON.stringify({orgId,userId:m.user_id})})
      const d=await r.json().catch(()=>({}))
      if(!r.ok)throw new Error(d.error||'Could not remove user')
      setOk(true);setMsg('User removed from this company.');await load()
    }catch(e){setMsg(e.message)}finally{setBusy(false)}
  }

  return <div className="section adminEnhancedSection">
    <div className="row"><h3>Users & Access</h3><button className="secondary" onClick={load}>Refresh</button></div>
    <div className="userCreateRow">
      <label className="fieldGroup"><span>Email</span><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="user@company.com"/></label>
      <label className="fieldGroup"><span>Role</span><select value={role} onChange={e=>setRole(e.target.value)}>{ROLES.map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></label>
      <label className="fieldGroup"><span>Temporary Password</span><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters"/></label>
      <button className="primary" disabled={busy} onClick={createUser}>{busy?'Creating...':'Create User'}</button>
    </div>
    <div className="userHelp">User signs in with this temporary password and is forced to change it on first login.</div>
    {msg&&<div className={ok?'successMsg':'errorMsg'}>{msg}</div>}
    {members.map(m=><div className="memberEnhanced" key={m.user_id}>
      <div><b>{m.full_name||m.email}</b><div className="tiny">{m.email}</div></div>
      <select value={m.role} disabled={m.user_id===session?.user?.id} onChange={e=>updateMember(m,{role:e.target.value})}>{ROLES.map(([v,l])=><option value={v} key={v}>{l}</option>)}</select>
      <label><input type="checkbox" checked={!!m.is_active} disabled={m.user_id===session?.user?.id} onChange={e=>updateMember(m,{is_active:e.target.checked})}/> Active</label>
      <button className="deleteUser" disabled={busy||m.user_id===session?.user?.id} onClick={()=>removeMember(m)}>{m.user_id===session?.user?.id?'Current User':'Delete User'}</button>
    </div>)}
  </div>
}
