import '../styles/minimal.css'
import {useEffect,useState} from 'react'
import {createPortal} from 'react-dom'

const ROLES=[['hr_admin','HR Admin'],['hr','HR'],['hiring_manager','Hiring Manager'],['interviewer','Interviewer'],['viewer','Viewer']]

export default function App({ Component, pageProps }) {
  const [orgId,setOrgId]=useState('')
  const [session,setSession]=useState(null)
  const [target,setTarget]=useState(null)

  useEffect(()=>{
    if(typeof window==='undefined')return
    const syncLocal=()=>{
      try{
        const raw=localStorage.getItem('recruitment_os_session')
        const nextSession=raw?JSON.parse(raw):null
        const nextOrg=localStorage.getItem('recruitment_os_active_org')||''
        setSession(prev=>prev?.access_token===nextSession?.access_token&&prev?.user?.id===nextSession?.user?.id?prev:nextSession)
        setOrgId(prev=>prev===nextOrg?prev:nextOrg)
      }catch{}
    }
    syncLocal()
    const timer=setInterval(syncLocal,1000)
    return()=>clearInterval(timer)
  },[])

  useEffect(()=>{
    if(typeof document==='undefined')return
    const find=()=>{
      const el=document.querySelector('.adminGrid')
      setTarget(prev=>prev===el?prev:el)
    }
    find()
    const mo=new MutationObserver(find)
    mo.observe(document.body,{childList:true,subtree:true})
    return()=>mo.disconnect()
  },[])

  return <>
    <Component {...pageProps} />
    {target&&session?.user?.id&&orgId&&createPortal(<AdminUsersInline session={session} orgId={orgId}/>,target)}
    <style jsx global>{`
      .content>.pageHead+.pageHead{display:none!important}
      .adminGrid>.section:nth-child(2){display:none!important}
      .adminEnhancedSection{order:2}
      .adminEnhancedSection .userCreateRow{display:grid;grid-template-columns:minmax(210px,1.5fr) minmax(150px,.9fr) minmax(190px,1fr) auto;gap:10px;align-items:center;margin-bottom:14px}
      .adminEnhancedSection .userCreateRow input,.adminEnhancedSection .userCreateRow select{min-width:0}
      .adminEnhancedSection .memberEnhanced{display:grid;grid-template-columns:minmax(220px,1fr) 170px auto auto;gap:12px;align-items:center;padding:12px 0;border-top:1px solid #eee9f1}
      .adminEnhancedSection .memberEnhanced:first-of-type{border-top:0}
      .adminEnhancedSection .memberEnhanced .deleteUser{background:#fff0f3!important;color:#ed1944!important;border:1px solid #ffd9e1!important;border-radius:9px!important;padding:8px 11px!important;font-weight:800!important;cursor:pointer}
      .adminEnhancedSection .memberEnhanced .deleteUser:disabled{opacity:.45;cursor:not-allowed}
      .adminEnhancedSection .memberEnhanced label{display:flex;gap:6px;align-items:center;white-space:nowrap}
      .adminEnhancedSection .userHelp{font-size:11px;color:#746d78;margin:-4px 0 12px}
      @media(max-width:900px){.adminEnhancedSection .userCreateRow{grid-template-columns:1fr}.adminEnhancedSection .memberEnhanced{grid-template-columns:1fr}}
    `}</style>
  </>
}

function AdminUsersInline({session,orgId}){
  const[email,setEmail]=useState(''),[password,setPassword]=useState(''),[role,setRole]=useState('viewer'),[members,setMembers]=useState([]),[busy,setBusy]=useState(false),[msg,setMsg]=useState('')

  async function callData(op,payload={}){
    const r=await fetch('/api/data',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session?.access_token||''}`,'X-Refresh-Token':session?.refresh_token||''},body:JSON.stringify({op,userId:session?.user?.id,refreshToken:session?.refresh_token||'',orgId,...payload})})
    const d=await r.json().catch(()=>({}))
    if(!r.ok)throw new Error(d.error||'Request failed')
    return d
  }

  async function load(){if(!session?.user?.id||!orgId)return;try{const d=await callData('list_members');setMembers(d.members||[])}catch(e){setMsg(e.message)}}
  useEffect(()=>{load()},[session?.user?.id,orgId])

  async function createUser(){
    setMsg('')
    if(!email.trim())return setMsg('Email is required.')
    if(password.length<8)return setMsg('Temporary password must be at least 8 characters.')
    setBusy(true)
    try{
      const r=await fetch('/api/admin-create-user',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session?.access_token||''}`},body:JSON.stringify({email:email.trim(),password,role,orgId})})
      const d=await r.json().catch(()=>({}))
      if(!r.ok)throw new Error(d.error||'Could not create user')
      setEmail('');setPassword('');setRole('viewer');setMsg('User created. They must change the temporary password on first login.');await load()
    }catch(e){setMsg(e.message)}finally{setBusy(false)}
  }

  async function updateMember(m,patch){
    setBusy(true);setMsg('')
    try{await callData('update_member',{memberUser:m.user_id,role:patch.role??m.role,isActive:patch.is_active??m.is_active});await load()}catch(e){setMsg(e.message)}finally{setBusy(false)}
  }

  async function removeMember(m){
    if(m.user_id===session?.user?.id)return
    if(!window.confirm(`Remove ${m.email} from this company?`))return
    setBusy(true);setMsg('')
    try{
      const r=await fetch('/api/admin-remove-user',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session?.access_token||''}`},body:JSON.stringify({orgId,userId:m.user_id})})
      const d=await r.json().catch(()=>({}))
      if(!r.ok)throw new Error(d.error||'Could not remove user')
      await load()
    }catch(e){setMsg(e.message)}finally{setBusy(false)}
  }

  return <div className="section adminEnhancedSection">
    <div className="row"><h3>Users & Access</h3><button className="secondary" onClick={load}>Refresh</button></div>
    <div className="userCreateRow">
      <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="user@company.com"/>
      <select value={role} onChange={e=>setRole(e.target.value)}>{ROLES.map(([v,l])=><option value={v} key={v}>{l}</option>)}</select>
      <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Temporary Password"/>
      <button className="primary" disabled={busy} onClick={createUser}>Create User</button>
    </div>
    <div className="userHelp">The user signs in with this temporary password and is forced to change it before entering ATS.</div>
    {msg&&<div className="boardHint" style={{marginBottom:10}}>{msg}</div>}
    {members.map(m=><div className="memberEnhanced" key={m.user_id}>
      <div><b>{m.full_name||m.email}</b><div className="tiny">{m.email}</div></div>
      <select value={m.role} disabled={m.user_id===session?.user?.id} onChange={e=>updateMember(m,{role:e.target.value})}>{ROLES.map(([v,l])=><option value={v} key={v}>{l}</option>)}</select>
      <label><input type="checkbox" checked={!!m.is_active} disabled={m.user_id===session?.user?.id} onChange={e=>updateMember(m,{is_active:e.target.checked})}/> Active</label>
      <button className="deleteUser" disabled={busy||m.user_id===session?.user?.id} onClick={()=>removeMember(m)}>{m.user_id===session?.user?.id?'Current User':'Delete User'}</button>
    </div>)}
  </div>
}
