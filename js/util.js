const promiseResult = (p)=>new Promise((rs, rj)=>p.then((v)=>isErr(v) ? rj(new Error(v.msg)) : rs(v)
        ).catch(rj)
    )
;
const isErr = (t)=>t.kind == 'err'
;
export { promiseResult as promiseResult };
export { isErr as isErr };
