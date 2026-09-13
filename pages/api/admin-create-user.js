const SUPABASE_URL='https://wpjixgfnynrboptwpotd.supabase.co'
const KEY='sb_publishable_IwnnE09a7GnBzIHG-Z4ssQ_gTJTqLfg'

async function jsonFetch(url,opts={}){
  const r=await fetch(url,opts); const data=await r.json().catch(()=>({}));
  return {r,data}
}
function expired(token){
  try{const p=JSON.parse(Buffer.from((token||'').split('.')[1]||'','base64url').toString());return !p.exp||p.exp*1000<Date.now()+15000}catch{return true}
}
async function refreshSession(refreshToken){
  if(!refreshToken)return null
  const {r,data}=await jsonFetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,{
    method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:refreshToken})
  })
  if(!r.ok)return null
  return data
}

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'})
  let token=(req.headers.authorization||'').replace(/^Bearer\s+/i,'')
  let refreshToken=req.headers['x-refresh-token']||req.body?.refreshToken||''
  const {email,password,role='viewer',orgId}=req.body||{}
  const normalizedEmail=(email||'').trim().toLowerCase()
  if(!normalizedEmail||!password||!orgId) return res.status(400).json({error:'Email, temporary password and company are required'})
  if(password.length<8) return res.status(400).json({error:'Temporary password must be at least 8 characters'})
  try{
    let refreshed=null
    if(!token||expired(token)){
      const s=await refreshSession(refreshToken)
      if(!s?.access_token)return res.status(401).json({error:'Session expired. Please sign in again.'})
      token=s.access_token; refreshToken=s.refresh_token||refreshToken
      refreshed={access_token:token,refresh_token:refreshToken,user:s.user}
    }
    let create=await jsonFetch(`${SUPABASE_URL}/rest/v1/rpc/admin_create_user_no_email`,{
      method:'POST',
      headers:{apikey:KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
      body:JSON.stringify({org:orgId,member_email:normalizedEmail,member_password:password,member_role:role})
    })
    if(create.r.status===401&&refreshToken){
      const s=await refreshSession(refreshToken)
      if(s?.access_token){
        token=s.access_token; refreshToken=s.refresh_token||refreshToken
        refreshed={access_token:token,refresh_token:refreshToken,user:s.user}
        create=await jsonFetch(`${SUPABASE_URL}/rest/v1/rpc/admin_create_user_no_email`,{
          method:'POST',headers:{apikey:KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
          body:JSON.stringify({org:orgId,member_email:normalizedEmail,member_password:password,member_role:role})
        })
      }
    }
    if(!create.r.ok){
      const msg=create.data?.message||create.data?.msg||create.data?.error_description||create.data?.hint||'Could not create user'
      return res.status(create.r.status).json({error:msg})
    }
    return res.status(200).json({ok:true,user_id:create.data,session:refreshed})
  }catch(e){return res.status(500).json({error:e.message||'User creation failed'})}
}