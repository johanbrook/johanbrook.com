var L=Object.defineProperty;var r=(t,e)=>L(t,"name",{value:e,configurable:!0});var p={owner:"johanbrook",repo:"johanbrook.com",notesDir:"src/notes"},b=r(()=>location.hostname=="localhost","isLocal");var g=r(t=>t.kind=="err","isErr");var E="jb_tok",U="https://api.github.com",w=r(({url:t})=>{let e=r(()=>{location.href=t},"doAuth"),o=r(async(n,{method:c="GET",query:a,body:l}={})=>{let d=y();if(!d)return e(),Promise.resolve({});let h=a?"?"+new URLSearchParams(a).toString():"",f=await fetch(U+n+h,{method:c,headers:{accept:"application/vnd.github.v3+json",authorization:`token ${d}`},body:l?JSON.stringify(l):void 0}),T=await f.json();return f.ok?T:f.status==401?(e(),Promise.resolve({})):{kind:"err",msg:"Failed to request GitHub REST data",cause:new Error(`${c} ${f.status} ${n}: ${T.message||f.statusText}`)}},"request"),s=r(n=>!!n.error,"isAuthError");return{maybeLogin:r(()=>{y()||(location.href=t)},"maybeLogin"),fetchToken:r(async n=>{let c=location.pathname+location.search.replace(/\bcode=\w+/,"").replace(/\?$/,"");history.pushState({},"",c);let a=await fetch(t,{method:"POST",mode:"cors",headers:{"content-type":"application/json"},body:JSON.stringify({code:n})});if(!a.ok)return{kind:"err",msg:a.statusText};let l=await a.json();if(s(l))return{kind:"err",msg:l.error};try{localStorage.setItem(E,l.token)}catch{}return{kind:"token",tok:l.token}},"fetchToken"),createNote:r(async(n,c)=>{let a=new Date,{repo:l,owner:d,notesDir:h}=p,f=b()?"dev":"main",T=v(a),A=v(a,!0),k=`---
date: ${T}
location: On the run
`;c&&(k+="draft: true"),k+=`
---
${n}
`;let P=`${A}.md`,_=h+"/"+P,u=await o(`/repos/${d}/${l}/contents/${_}`,{method:"PUT",body:{message:"Add note from GUI app",content:I(k),branch:f}});return g(u)?u:!u.content?.name||!u.content?.html_url||!u.commit.html_url?{kind:"err",msg:"Unexpected response when creating a note"}:{commitUrl:u.commit.html_url,file:u.content.name,fileUrl:u.content.html_url}},"createNote")}},"mkGitHub"),y=r(()=>{try{return localStorage.getItem(E)}catch{return null}},"getStoredToken"),I=r(t=>btoa(encodeURIComponent(t).replace(/%([0-9A-F]{2})/g,(e,o)=>String.fromCharCode(parseInt(o,16)))),"base64"),v=r((t,e=!1)=>{let o=[t.getUTCFullYear(),t.getUTCMonth()+1,t.getUTCDate()].map(i=>String(i).padStart(2,"0")).join("-"),s=[t.getUTCHours(),t.getUTCMinutes(),e?null:t.getUTCSeconds()].filter(Boolean).map(i=>String(i).padStart(2,"0")).join(e?"-":":");return e?o+"-"+s:o+" "+s},"formatDate");var R=b()?"http://localhost:3001":"https://github-oauth.brookie.workers.dev",H=r((t,e)=>w(e),"mkService"),x=r(async()=>{let t=H("github",{url:R}),e=document.getElementById("root"),o=M(),s=D(o),i=C(t),m=r(async n=>{e.innerHTML=await i(n)},"html"),S=r(async n=>{console.log("update",n);let c=s(n);console.log("state",c),await m(c)},"tick");window.handleEvt=async(n,c)=>{switch(console.log("event",n,c),c.kind){case"note_input":{let a=n.target;window.submitNote.disabled=a.value.trim().length==0,a.parentElement.dataset.replicatedValue=a.value;break}case"submit_note":{n.preventDefault();let a=n.target,l=a.querySelector("textarea").value.trim(),d=a.querySelector("#draft-check").checked;if(!l)return;let h=await t.createNote(l,d);g(h)?await S({err:h}):(j(window.submitNote,"\u2728 posted! \u2728"),await S({createNote:h}));break}}},await S(o)},"runApp"),C=r(t=>async e=>{let o=new URL(location.href).searchParams.get("code");if(o){let s=await t.fetchToken(o);if(g(s))return N(s)}return t.maybeLogin(),e.err?N(e.err):`
            <section>
                <h1 class="mb2 no-rhythm">${p.repo}</h1>
                <p>
                    <a href="https://github.com/${p.owner}/${p.repo}">${p.owner}/${p.repo}</a>
                </p>

                ${O()}

                ${e.createNote?`<p>Note created in repo: <a href="${e.createNote.fileUrl}">${e.createNote.file}</a></p>`:""}

                <p>
                    <a href="/mind" class="f6">View all notes</a>
                </p>
            </section>`},"App"),D=r(t=>{function*e(){let s={},i=t;for(;;){let m={...i,...s};i=m,s=yield m}}r(e,"gen");let o=e();return o.next(t),s=>o.next(s).value},"reducer"),$=r((t,e)=>`on${t}='handleEvt(event${e?", "+JSON.stringify(e):""})'`,"ev"),O=r(()=>`
    <form
        ${$("submit",{kind:"submit_note"})}
        class="measure-narrow mx-auto"
    >
        <h2>New note</h2>

        <div class="grow-wrap mb3">
            <textarea
                ${$("input",{kind:"note_input"})}
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
`,"NewNote"),N=r(t=>`
    <section>
        <h1>Error</h1>
        <p>${t.msg}</p>
        ${t.cause?`<pre>${t.cause.message}</pre>`:""}
    </section>
`,"Error"),j=r((t,e)=>{let o=t instanceof HTMLInputElement?t.value:t.innerText,s=r((i,m)=>{t instanceof HTMLInputElement?(t.value=i,t.disabled=m):t.innerText=i},"set");s(e,!0),setTimeout(()=>{s(o,!1)},3e3)},"flash");var M=r(()=>{let t=(()=>{try{let e=localStorage.getItem("jb_state")??"{}";return JSON.parse(e)}catch{return{}}})();return{}},"initialState");x().catch(console.error);