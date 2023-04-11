var L=Object.defineProperty;var r=(t,e)=>L(t,"name",{value:e,configurable:!0});var p={owner:"johanbrook",repo:"johanbrook.com",notesDir:"src/notes"},b=r(()=>location.hostname=="localhost","isLocal");var f=r(t=>t.kind=="err","isErr");var y="jb_tok",U="https://api.github.com",v=r(({url:t})=>{let e=r(()=>{location.href=t},"doAuth"),n=r(async(o,{method:c="GET",query:a,body:u}={})=>{let d=E();if(!d)return e(),Promise.resolve({});let h=a?"?"+new URLSearchParams(a).toString():"",g=await fetch(U+o+h,{method:c,headers:{accept:"application/vnd.github.v3+json",authorization:`token ${d}`},body:u?JSON.stringify(u):void 0}),S=await g.json();return g.ok?S:g.status==401?(e(),Promise.resolve({})):{kind:"err",msg:"Failed to request GitHub REST data",cause:new Error(`${c} ${g.status} ${o}: ${S.message||g.statusText}`)}},"request"),s=r(o=>!!o.error,"isAuthError");return{maybeLogin:r(()=>{E()||(location.href=t)},"maybeLogin"),fetchToken:r(async o=>{let c=location.pathname+location.search.replace(/\bcode=\w+/,"").replace(/\?$/,"");history.pushState({},"",c);let a=await fetch(t,{method:"POST",mode:"cors",headers:{"content-type":"application/json"},body:JSON.stringify({code:o})});if(!a.ok)return{kind:"err",msg:a.statusText};let u=await a.json();if(s(u))return{kind:"err",msg:u.error};try{localStorage.setItem(y,u.token)}catch{}return{kind:"token",tok:u.token}},"fetchToken"),createNote:r(async(o,c)=>{let a=new Date,{repo:u,owner:d,notesDir:h}=p,g=b()?"dev":"main",S=w(a),A=w(a,!0),k=`---
date: ${S}
location: The web
`;c&&(k+="draft: true"),k+=`
---
${o}
`;let P=`${A}.md`,_=h+"/"+P,l=await n(`/repos/${d}/${u}/contents/${_}`,{method:"PUT",body:{message:"Add note from web app",content:R(k),branch:g}});return f(l)?l:!l.content?.name||!l.content?.html_url||!l.commit.html_url?{kind:"err",msg:"Unexpected response when creating a note"}:{commitUrl:l.commit.html_url,file:l.content.name,fileUrl:l.content.html_url}},"createNote")}},"mkGitHub"),E=r(()=>{try{return localStorage.getItem(y)}catch{return null}},"getStoredToken"),R=r(t=>btoa(encodeURIComponent(t).replace(/%([0-9A-F]{2})/g,(e,n)=>String.fromCharCode(parseInt(n,16)))),"base64"),w=r((t,e=!1)=>{let n=[t.getUTCFullYear(),t.getUTCMonth()+1,t.getUTCDate()].map(i=>String(i).padStart(2,"0")).join("-"),s=[t.getUTCHours(),t.getUTCMinutes(),e?null:t.getUTCSeconds()].filter(Boolean).map(i=>String(i).padStart(2,"0")).join(e?"-":":");return e?n+"-"+s:n+" "+s},"formatDate");var H=b()?"http://localhost:8788/github-oauth":"https://brookie.pages.dev/github-oauth",I=r((t,e)=>v(e),"mkService"),N=r(async()=>{let t=I("github",{url:H}),e=document.getElementById("root"),n=O(),s=D(n),i=C(t),m=r(async o=>{e.innerHTML=await i(o)},"html"),T=r(async o=>{console.log("update",o);let c=s(o);console.log("state",c),await m(c)},"tick");window.handleEvt=async(o,c)=>{switch(console.log("event",o,c),c.kind){case"note_input":{let a=o.target;window.submitNote.disabled=a.value.trim().length==0,a.parentElement.dataset.replicatedValue=a.value;break}case"submit_note":{o.preventDefault();let a=o.target,u=a.querySelector("textarea").value.trim(),d=a.querySelector("#draft-check").checked;if(!u)return;let h=await t.createNote(u,d);f(h)?await T({err:h}):(M(window.submitNote,"\u2728 posted! \u2728"),await T({createNote:h}));break}}},await T(n)},"runApp"),C=r(t=>async e=>{let n=new URL(location.href).searchParams.get("code");if(n){let s=await t.fetchToken(n);if(f(s))return $(s)}return t.maybeLogin(),e.err?$(e.err):`
            <section>
                <h1 class="mb2 no-rhythm">${p.repo}</h1>
                <p>
                    <a href="https://github.com/${p.owner}/${p.repo}">${p.owner}/${p.repo}</a>
                </p>

                ${j()}

                ${e.createNote?`<p>Note created in repo: <a href="${e.createNote.fileUrl}">${e.createNote.file}</a></p>`:""}

                <p>
                    <a href="/mind" class="f6">View all notes</a>
                </p>
            </section>`},"App"),D=r(t=>{function*e(){let s={},i=t;for(;;){let m={...i,...s};i=m,s=yield m}}r(e,"gen");let n=e();return n.next(t),s=>n.next(s).value},"reducer"),x=r((t,e)=>`on${t}='handleEvt(event${e?", "+JSON.stringify(e):""})'`,"ev"),j=r(()=>`
    <form
        ${x("submit",{kind:"submit_note"})}
        class="measure-narrow mx-auto"
    >
        <h2>New note</h2>

        <div class="grow-wrap mb3">
            <textarea
                ${x("input",{kind:"note_input"})}
                placeholder="Text\u2026"
                class="w-full f5"
            ></textarea>
        </div>

        <p>
            <label>
                <input class="checkbox-fix" type="checkbox" id="draft-check">
                Draft
            </label>
        </p>

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
`,"NewNote"),$=r(t=>`
    <section>
        <h1>Error</h1>
        <p>${t.msg}</p>
        ${t.cause?`<pre>${t.cause.message}</pre>`:""}
    </section>
`,"Error"),M=r((t,e)=>{let n=t instanceof HTMLInputElement?t.value:t.innerText,s=r((i,m)=>{t instanceof HTMLInputElement?(t.value=i,t.disabled=m):t.innerText=i},"set");s(e,!0),setTimeout(()=>{s(n,!1)},3e3)},"flash");var O=r(()=>{let t=(()=>{try{let e=localStorage.getItem("jb_state")??"{}";return JSON.parse(e)}catch{return{}}})();return{}},"initialState");N().catch(console.error);

/*# sourceMappingURL=./admin.js.map */