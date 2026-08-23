function clean(x=''){return String(x).toLowerCase().replace(/[^a-z0-9+#.\s-]/gi,' ')}
function tokens(x=''){return [...new Set(clean(x).split(/\s+/).filter(t=>t.length>2))]}
function years(text=''){const m=[...String(text).matchAll(/(\d{1,2})\s*(?:\+\s*)?(?:years?|yrs?)/gi)].map(x=>Number(x[1]));return m.length?Math.max(...m):0}
function pct(n,d){return d?Math.round(n/d*100):0}
export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'})
 try{
  const {resumeText='',job={}}=req.body||{}
  const resume=clean(resumeText), jd=clean(job.jd||''), mustRaw=job.must||''
  const must=tokens(mustRaw), jdTerms=tokens(jd).filter(t=>!['with','and','the','for','from','that','this','you','your','our','are','have','will'].includes(t))
  const matchedMust=must.filter(t=>resume.includes(t)), missingMust=must.filter(t=>!resume.includes(t))
  const matchedJd=jdTerms.filter(t=>resume.includes(t))
  const mustScore=must.length?pct(matchedMust.length,must.length):70
  const relevanceScore=jdTerms.length?pct(matchedJd.length,jdTerms.length):65
  const expYears=years(resumeText)
  const seniorityText=clean(job.seniority||job.title||'')
  const targetYears=/senior|lead|manager|head/.test(seniorityText)?5:/mid|specialist/.test(seniorityText)?3:1
  const experienceScore=Math.min(100,Math.round((Math.max(expYears,1)/targetYears)*100))
  const evidenceWords=['led','managed','built','owned','launched','improved','reduced','increased','designed','implemented','developed','created','delivered','scaled','optimized']
  const evidenceHits=evidenceWords.filter(w=>resume.includes(w)).length
  const evidenceScore=Math.min(100,35+evidenceHits*10)
  let score=Math.round(mustScore*.45+relevanceScore*.25+experienceScore*.15+evidenceScore*.15)
  if(must.length&&matchedMust.length===0)score=Math.min(score,49)
  score=Math.max(25,Math.min(98,score))
  const recommendation=score>=80?'Strong Match':score>=65?'HR Review':score>=50?'Borderline':'Low Match'
  const strengths=[]
  if(matchedMust.length)strengths.push(`Matched must-have: ${matchedMust.slice(0,6).join(', ')}`)
  if(expYears)strengths.push(`Experience evidence: about ${expYears}+ years mentioned`)
  if(evidenceHits>=3)strengths.push('Resume includes multiple delivery/ownership signals')
  const risks=[]
  if(missingMust.length)risks.push(`Missing/unclear must-have: ${missingMust.slice(0,6).join(', ')}`)
  if(experienceScore<70)risks.push('Experience level may be below the role expectation')
  if(relevanceScore<45)risks.push('Overall resume-to-JD relevance is limited')
  const summary=`${recommendation}. Must-have ${mustScore}%, JD relevance ${relevanceScore}%, experience ${experienceScore}%, evidence ${evidenceScore}%.`
  return res.json({score,recommendation,summary,details:{mustScore,relevanceScore,experienceScore,evidenceScore,matchedMust,missingMust,strengths,risks,experienceYears:expYears}})
 }catch(e){return res.status(500).json({error:e.message||'Screening failed'})}
}