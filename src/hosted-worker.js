import {render,seoResources} from './entry-server.jsx';
import template from 'virtual:next-jump-template';
import {hostedReceipts,hostedSecurityHeaders} from './hosted-receipts.js';
import {catalogService} from './catalog/service.js';
import {workAuth,staffIdentity,staffLoginResponse} from './catalog/work-auth.js';

export default {async fetch(request,env){
 const url=new URL(request.url);
 let decoded;try{decoded=decodeURIComponent(url.pathname)}catch{return new Response('Not found',{status:404})}
 if(decoded.includes('\\')||decoded.split('/').some(p=>p.startsWith('.')))return new Response('Not found',{status:404,headers:hostedSecurityHeaders});
 const auth=await workAuth(request,env);if(auth)return auth;
 const staffPath=url.pathname==='/staff'||url.pathname.startsWith('/staff/')||url.pathname.startsWith('/api/staff');
 const identity=staffPath?await staffIdentity(request,env):null;
 if((url.pathname==='/staff'||url.pathname.startsWith('/staff/'))&&!identity)return staffLoginResponse(request,env);
 const catalog=await catalogService(request,env,{staffIdentity:identity});if(catalog)return catalog;
 const api=await hostedReceipts(request,env);if(api)return api;
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:hostedSecurityHeaders});
 if(url.pathname.startsWith('/api/'))return new Response('Not found',{status:404,headers:hostedSecurityHeaders});
 if(['/robots.txt','/sitemap.xml'].includes(url.pathname)){
  const resources=seoResources(),isRobots=url.pathname==='/robots.txt';
  return new Response(request.method==='HEAD'?null:isRobots?resources.robots:resources.sitemap,{headers:{...hostedSecurityHeaders,'Content-Type':isRobots?'text/plain; charset=utf-8':'application/xml; charset=utf-8'}});
 }
 if(/^\/(assets|images|fonts)\//.test(url.pathname)||/^\/(favicon[^/]*|apple-touch-icon[^/]*)$/.test(url.pathname)){
  const response=await env.ASSETS.fetch(request);const headers=new Headers(response.headers);
  for(const [k,v]of Object.entries(hostedSecurityHeaders))headers.set(k,v);
  return new Response(response.body,{status:response.status,headers});
 }
 try{
  const result=render(url.pathname+url.search);
  const html=template.replace('<!--app-head-->',result.head).replace(/<!--(?:app-html|ssr-outlet)-->/,result.html);
  return new Response(request.method==='HEAD'?null:html,{status:result.status,headers:{...hostedSecurityHeaders,'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':result.robots}});
 }catch{return new Response('This preview page could not load. Please refresh or return home.',{status:500,headers:hostedSecurityHeaders})}
}};
