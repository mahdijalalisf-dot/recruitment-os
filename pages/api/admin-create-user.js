const SUPABASE_URL='https://wpjixgfnynrboptwpotd.supabase.co'
const KEY='sb_publishable_IwnnE09a7GnBzIHG-Z4ssQ_gTJTqLfg'

async function jsonFetch(url,opts={}){
  const r=await fetch(url,opts); const data=await r.json().catch(()=>({}));
  return {r,data}
}

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'})
  const auth=req.headers.authorization||''
  const token=auth.replace(/^Bearer\s+/i,'')
  const {email,password,role='viewer',orgId}=req.body||{}
  const normalizedEmail=(email||'').trim().toLowerCase()
  if(!token) return res.status(401).json({error:'Authentication required'})
  if(!normalizedEmail||!password||!orgId) return res.status(400).json({error:'Email, temporary password and company are required'})
  if(password.length<8) return res.status(400).json({error:'Temporary password must be at least 8 characters'})
  try{
    const check=await jsonFetch(`${SUPABASE_URL}/rest/v1/organization_members?organization_id=eq.${encodeURIComponent(orgId)}&role=eq.hr_admin&is_active=eq.true&select=user_id`,{headers:{apikey:KEY,Authorization:`Bearer ${token}`}})
    if(!check.r.ok) return res.status(check.r.status).json({error:'Could not verify admin access'})
    const me=await jsonFetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{apikey:KEY,Authorization:`Bearer ${token}`}})
    if(!me.r.ok) return res.status(401).json({error:'Invalid session'})
    if(!(check.data||[]).some(x=>x.user_id===me.data.id)) return res.status(403).json({error:'HR Admin access required'})

    // If the account already exists, assign access and reset its temporary password.
    let setup=await jsonFetch(`${SUPABASE_URL}/rest/v1/rpc/admin_set_temporary_password`,{
      method:'POST',headers:{apikey:KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
      body:JSON.stringify({org:orgId,member_email:normalizedEmail,temporary_password:password,member_role:role})
    })
    if(setup.r.ok) return res.status(200).json({ok:true,user_id:setup.data,existing:true})

    // Otherwise create the auth account, then set the temporary password/access via the admin RPC.
    const signup=await jsonFetch(`${SUPABASE_URL}/auth/v1/signup`,{
      method:'POST',headers:{apikey:KEY,Authorization:`Bearer ${KEY}`,'Content-Type':'application/json'},
      body:JSON.stringify({email:normalizedEmail,password,data:{must_change_password:true,created_by_admin:true}})
    })
    if(!signup.r.ok){
      const msg=signup.data?.msg||signup.data?.message||signup.data?.error_description||'Could not create user'
      return res.status(signup.r.status).json({error:msg})
    }

    setup=await jsonFetch(`${SUPABASE_URL}/rest/v1/rpc/admin_set_temporary_password`,{
      method:'POST',headers:{apikey:KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
      body:JSON.stringify({org:orgId,member_email:normalizedEmail,temporary_password:password,member_role:role})
    })
    if(!setup.r.ok) return res.status(setup.r.status).json({error:setup.data?.message||'User created but access assignment failed'})
    return res.status(200).json({ok:true,user_id:setup.data,existing:false})
  }catch(e){return res.status(500).json({error:e.message||'User creation failed'})}
}
