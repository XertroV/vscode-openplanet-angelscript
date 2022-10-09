

interface CoreMethod {
    returntypedecl: string,
    name: string,
    args: CoreArg[],
    decl?: string,
}
interface CoreArg {
    name: string,
    typedecl: string,
    // typename: string,
}

interface CoreProperty {
    name: string,
    typedecl: string
}

interface CoreTy {
    name: string, ns: string, desc: string,
    behaviors?: CoreMethod[],
    methods?: CoreMethod[],
    props?: CoreProperty[],
}

export function ConvertNadeoType(ty: string, tyDeets: any) {
    throw ('todo')
    let ret: CoreTy = { name: ty, ns: '', desc: '' }
    ret.behaviors = [];
    ret.methods = [];
    ret.props = [];
    let inheritsFrom = tyDeets.p;
    let members = tyDeets.m;
    if (members) {
        for (let key in members) {
            let mDeets = members[key];
            let isEnum = "e" in mDeets;
            let isFunc = !isEnum && typeof(mDeets.t) == "number";
            let isProp = !isEnum && typeof(mDeets.t) == "string";

            if (isEnum) {}
            else if (isFunc)
                ret.methods.push(ConvertNadeoTypeMethod(key, mDeets));
            else if (isProp)
                ret.props.push(ConvertNadeoTypeProp(key, mDeets))
        }
    }
}

export function ConvertNadeoTypeMethod(name: string, deets: any): CoreMethod {
    let returntypedecl = deets.r;
    let _args = deets.a.split(", "); // e.g., ["CMwNod@ Nod", "bool StatsOnly"]
    let args: CoreArg[] = [];
    _args.forEach((sArg: string) => {
        let [typedecl, name] = sArg.split(' ');
        args.push({name, typedecl});
    })
    return { name, returntypedecl, args };
}
export function ConvertNadeoTypeProp(name: string, deets: any): CoreProperty {
    return {name, typedecl: deets.t};
}

export function ConvertNadeoTypeBehaviour(name: string, deets: any) {}
