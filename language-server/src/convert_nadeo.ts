

export interface CoreMethod {
    returntypedecl: string,
    name: string,
    args: CoreArg[],
    decl?: string,
}

export interface CoreArg {
    name: string,
    typedecl: string,
    // typename: string,
}

export interface CoreProperty {
    name: string,
    typedecl: string
}

export interface CoreTy {
    name: string, ns: string, desc: string,
    inherits?: string,
    behaviors?: CoreMethod[],
    methods?: CoreMethod[],
    props?: CoreProperty[],
    subtypes?: string[],
}

export function ConvertNadeoType(ty: string, tyDeets: any): CoreTy {
    let inherits = tyDeets.p;
    let ret: CoreTy = { name: ty, ns: null, desc: '', inherits }
    ret.behaviors = [];
    ret.methods = [];
    ret.props = [];
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
    // addSubTypes(ty, tyDeets, ret); // no nadeo types are templates
    // todo: also add methods and props recursively
    return ret;
}

function addSubTypes(ty: string, tyDeets: any, ret: CoreTy) {
    let hasSubtype = -1 < ret.methods.findIndex((m, i) => m.decl.includes("<T>"));
    if (hasSubtype)
        ret.subtypes = ["T"];
}

export function ConvertNadeoTypeMethod(name: string, deets: any): CoreMethod {
    let returntypedecl = deets.r;
    let args: CoreArg[] = [];
    if ("a" in deets) {
        let _args = deets.a.split(", "); // e.g., ["CMwNod@ Nod", "bool StatsOnly"]
        _args.forEach((sArg: string) => {
            let [typedecl, name] = sArg.split(' ');
            args.push({name, typedecl});
        })
    }
    return { name, returntypedecl, args };
}
export function ConvertNadeoTypeProp(name: string, deets: any): CoreProperty {
    return {name, typedecl: deets.t};
}

export function ConvertNadeoTypeBehaviour(name: string, deets: any) {

}
