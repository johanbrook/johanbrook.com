var P=Object.defineProperty;var r=(t,e)=>P(t,"name",{value:e,configurable:!0});var l={owner:"johanbrook",repo:"johanbrook.com",notesDir:"src/notes"},T=r(()=>location.hostname=="localhost","isLocal");var g=r(t=>t.kind=="err","isErr");var E="jb_tok",_="https://api.github.com",w=r(({url:t})=>{let e=r(()=>{location.href=t},"doAuth"),o=r(async(n,{method:i="GET",query:a,body:c}={})=>{let h=k();if(!h)return e(),Promise.resolve({});let b=a?"?"+new URLSearchParams(a).toString():"",d=await fetch(_+n+b,{method:i,headers:{accept:"application/vnd.github.v3+json",authorization:`token ${h}`},body:c?JSON.stringify(c):void 0}),S=await d.json();return d.ok?S:d.status==401?(e(),Promise.resolve({})):{kind:"err",msg:"Failed to request GitHub REST data",cause:new Error(`${i} ${d.status} ${n}: ${S.message||d.statusText}`)}},"request"),s=r(n=>!!n.error,"isAuthError");return{maybeLogin:r(()=>{k()||(location.href=t)},"maybeLogin"),fetchToken:r(async n=>{let i=location.pathname+location.search.replace(/\bcode=\w+/,"").replace(/\?$/,"");history.pushState({},"",i);let a=await fetch(t,{method:"POST",mode:"cors",headers:{"content-type":"application/json"},body:JSON.stringify({code:n})});if(!a.ok)return{kind:"err",msg:a.statusText};let c=await a.json();if(s(c))return{kind:"err",msg:c.error};try{localStorage.setItem(E,c.token)}catch{}return{kind:"token",tok:c.token}},"fetchToken"),createNote:r(async n=>{let i=new Date,{repo:a,owner:c,notesDir:h}=l,b=T()?"dev":"main",d=y(i),S=y(i,!0),$=`---
date: ${d}
location: On the run
---

${n}

`,N=`${S}.md`,A=h+"/"+N,p=await o(`/repos/${c}/${a}/contents/${A}`,{method:"PUT",body:{message:"Add note from GUI app",content:L($),branch:b}});return g(p)?p:!p.content?.name||!p.content?.html_url||!p.commit.html_url?{kind:"err",msg:"Unexpected response when creating a note"}:{commitUrl:p.commit.html_url,file:p.content.name,fileUrl:p.content.html_url}},"createNote")}},"mkGitHub"),k=r(()=>{try{return localStorage.getItem(E)}catch{return null}},"getStoredToken"),L=r(t=>btoa(encodeURIComponent(t).replace(/%([0-9A-F]{2})/g,(e,o)=>String.fromCharCode(parseInt(o,16)))),"base64"),y=r((t,e=!1)=>{let o=[t.getUTCFullYear(),t.getUTCMonth()+1,t.getUTCDate()].map(u=>String(u).padStart(2,"0")).join("-"),s=[t.getUTCHours(),t.getUTCMinutes(),e?null:t.getUTCSeconds()].filter(Boolean).map(u=>String(u).padStart(2,"0")).join(e?"-":":");return e?o+"-"+s:o+" "+s},"formatDate");var U=T()?"http://localhost:3001":"https://github-oauth.brookie.workers.dev",R=r((t,e)=>w(e),"mkService"),W=r(async()=>{let t=R("github",{url:U}),e=document.getElementById("root"),o=j(),s=H(o),u=I(t),m=r(async n=>{e.innerHTML=await u(n)},"html"),f=r(async n=>{console.log("update",n);let i=s(n);console.log("state",i),await m(i)},"tick");window.handleEvt=async(n,i)=>{switch(console.log("event",n,i),i.kind){case"note_input":{let a=n.target;window.submitNote.disabled=a.value.trim().length==0,a.parentElement.dataset.replicatedValue=a.value;break}case"submit_note":{n.preventDefault();let a=n.target.querySelector("textarea").value.trim();if(!a)return;let c=await t.createNote(a);g(c)?await f({err:c}):(O(window.submitNote,"\u2728 posted! \u2728"),await f({createNote:c}));break}}},await f(o)},"runApp"),I=r(t=>async e=>{let o=new URL(location.href).searchParams.get("code");if(o){let s=await t.fetchToken(o);if(g(s))return x(s)}return t.maybeLogin(),e.err?x(e.err):`
            <section>
                <h1 class="mb2 no-rhythm">${l.repo}</h1>
                <p>
                    <a href="https://github.com/${l.owner}/${l.repo}">${l.owner}/${l.repo}</a>
                </p>

                ${C()}

                ${e.createNote?`<p>Note created in repo: <a href="${e.createNote.fileUrl}">${e.createNote.file}</a></p>`:""}

                <p>
                    <a href="/mind" class="f6">View all notes</a>
                </p>
            </section>`},"App"),H=r(t=>{function*e(){let s={},u=t;for(;;){let m={...u,...s};u=m,s=yield m}}r(e,"gen");let o=e();return o.next(t),s=>o.next(s).value},"reducer"),v=r((t,e)=>`on${t}='handleEvt(event${e?", "+JSON.stringify(e):""})'`,"ev"),C=r(()=>`
    <form
        ${v("submit",{kind:"submit_note"})}
        class="measure-narrow mx-auto"
    >
        <h2>New note</h2>

        <div class="grow-wrap mb3">
            <textarea
                ${v("input",{kind:"note_input"})}
                placeholder="Text\u2026"
                class="w-full f5"
            ></textarea>
        </div>

        <p>
            <input
                type="submit"
                id="submitNote"
                value="Post it"
                class="btn"
                disabled
            />
        </p>
    </form>
`,"NewNote"),x=r(t=>`
    <section>
        <h1>Error</h1>
        <p>${t.msg}</p>
        ${t.cause?`<pre>${t.cause.message}</pre>`:""}
    </section>
`,"Error"),O=r((t,e)=>{let o=t instanceof HTMLInputElement?t.value:t.innerText,s=r((u,m)=>{t instanceof HTMLInputElement?(t.value=u,t.disabled=m):t.innerText=u},"set");s(e,!0),setTimeout(()=>{s(o,!1)},3e3)},"flash");var j=r(()=>{let t=(()=>{try{let e=localStorage.getItem("jb_state")??"{}";return JSON.parse(e)}catch{return{}}})();return{}},"initialState");export{W as runApp};
