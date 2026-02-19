// Cloudflare Worker - Vocab Sync API
// 部署到你的 Cloudflare 账号

export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    
    // 保存词汇进度
    if (url.pathname === '/save' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { vocabStatus } = body;
        
        const GITHUB_TOKEN = env.GITHUB_TOKEN;
        const REPO = env.GITHUB_REPO || 'snow1943/english-learning';
        const FILE = 'vocab-progress.json';
        
        // 获取当前文件 SHA
        const getResp = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE}`, {
          headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}` }
        });
        
        let sha = null;
        if (getResp.ok) {
          const data = await getResp.json();
          sha = data.sha;
        }
        
        const content = JSON.stringify({
          vocabStatus: vocabStatus || {},
          lastUpdated: new Date().toISOString()
        }, null, 2);
        
        // 更新文件
        const updateUrl = `https://api.github.com/repos/${REPO}/contents/${FILE}`;
        const updateBody = {
          message: 'Update vocab progress',
          content: btoa(content),
        };
        if (sha) updateBody.sha = sha;
        
        const resp = await fetch(updateUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateBody)
        });
        
        if (resp.ok) {
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          return new Response(JSON.stringify({ error: 'GitHub API error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    
    // 获取词汇进度
    if (url.pathname === '/load' && request.method === 'GET') {
      try {
        const GITHUB_TOKEN = env.GITHUB_TOKEN;
        const REPO = env.GITHUB_REPO || 'snow1943/english-learning';
        const FILE = 'vocab-progress.json';
        
        const resp = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE}`, {
          headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}` }
        });
        
        if (resp.ok) {
          const data = await resp.json();
          const content = atob(data.content);
          return new Response(content, {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          return new Response(JSON.stringify({ vocabStatus: {} }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } catch (e) {
        return new Response(JSON.stringify({ vocabStatus: {} }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    
    return new Response('Not Found', { status: 404 });
  }
};
