import Head from 'next/head'
import fs from 'fs'
import path from 'path'

export async function getStaticProps() {
  const html = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8')
  const body = html.match(/<body>([\s\S]*?)<\/body>/i)?.[1] || html
  const style = html.match(/<style>([\s\S]*?)<\/style>/i)?.[1] || ''
  let scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/gi)].map(m => m[1]).join('\n')
  scripts = scripts.replace("const URL='https://wpjixgfnynrboptwpotd.supabase.co'", "const URL=window.location.origin+'/supabase'")
  return { props: { body, style, scripts } }
}

export default function Home({ body, style, scripts }) {
  return <>
    <Head>
      <title>Recruitment OS</title>
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    </Head>
    <style dangerouslySetInnerHTML={{__html: style}} />
    <div dangerouslySetInnerHTML={{__html: body.replace(/<script>[\s\S]*?<\/script>/gi, '')}} />
    <script dangerouslySetInnerHTML={{__html: scripts}} />
  </>
}