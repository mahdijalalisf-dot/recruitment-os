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
    const create=await jsonFetch(`${SUPABASE_URL}/rest/v1/rpc/admin_create_user_no_email`,{
      method:'POST',
      headers:{apikey:KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
      body:JSON.stringify({org:orgId,member_email:normalizedEmail,member_password:password,member_role:role})
    })
    if(!create.r.ok){
      const msg=create.data?.message||create.data?.msg||create.data?.error_description||create.data?.hint||'Could not create user'
      return res.status(create.r.status).json({error:msg})
    }
    return res.status(200).json({ok:true,user_id:create.data})
  }catch(e){return res.status(500).json({error:e.message||'User creation failed'})}
}