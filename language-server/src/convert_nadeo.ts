

export function ConvertNadeoType(ty: string, tyDeets: any) {
    let ret = { name: ty, ns: '', desc: '', behaviors: [], methods: [], props: []};
    let inheritsFrom = tyDeets.p;
    let members = tyDeets.m;
    if (members) {
        for (let key in members) {
            let mDeets = members[key];
            let isEnum = "e" in mDeets;
            let isFunc = !isEnum && typeof(mDeets.t) == "number";
            let isProp = !isEnum && typeof(mDeets.t) == "string";

            if (isFunc)
                ConvertNadeoTypeMethod(key, mDeets);
        }
    }
}

export function ConvertNadeoTypeMethod(name: string, deets: any) {
    let retType = deets.r;
    let _args = deets.a.split(", "); // e.g., ["CMwNod@ Nod", "bool StatsOnly"]

}
export function ConvertNadeoTypeProp(name: string, deets: any) {}
export function ConvertNadeoTypeBehaviour(name: string, deets: any) {}
