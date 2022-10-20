import { CleanTypeName } from "./database";


export interface CoreMethod {
    i: number,
    returntypedecl: string,
    name: string,
    args: CoreArg[],
    decl?: string,
    desc?: string,
    isEnum: false
}

export interface CoreArg {
    name: string,
    typedecl: string,
    // typename: string,
}

export interface CoreProperty {
    i: number,
    name: string,
    typedecl: string,
    desc?: string,
    isEnum: false
}

export interface CoreTy {
    name: string, ns: string, desc: string,
    inherits?: string,
    behaviors?: CoreMethod[],
    methods?: CoreMethod[],
    props?: CoreProperty[],
    subtypes?: string[],
    enums?: CoreEnum[],
    isEnum: false
}

export interface CoreEnum {
    name: string, ns: string, desc: string,
    values: Record<string, number>,
    isEnum: true
}

export const NadeoTypesToDocsNS: Map<string, string> = new Map();

export function ConvertNadeoType(ty: string, tyDeets: any, docsNS: string): CoreTy {
    let inherits = tyDeets.p;
    let ret: CoreTy = { name: ty, ns: null, inherits, desc: '', isEnum: false }
    ret.behaviors = [];
    ret.methods = [];
    ret.props = [];
    ret.enums = [];
    let allAddedMembers: (CoreProperty | CoreMethod)[] = []

    NadeoTypesToDocsNS.set(ty, docsNS);

    let knownEnums = new Set<string>(); // just for this type
    let addToProps = (t: CoreProperty) => {
        ret.props.push(t);
        allAddedMembers.push(t);
    }
    let addToMethods = (t: CoreMethod) => {
        ret.methods.push(t);
        allAddedMembers.push(t);
    }

    let members = tyDeets.m;
    if (members) {
        for (let key in members) {
            let mDeets = members[key];
            let isEnum = "e" in mDeets;
            let isFunc = !isEnum && typeof(mDeets.t) == "number";
            let isProp = !isEnum && typeof(mDeets.t) == "string";

            if (isEnum) {
                //console.log(JSON.stringify({key, mDeets}, null, 2))
                if (!knownEnums.has(mDeets.e.n)) {
                    ret.enums.push(...ConvertNadeoTypeEnum(key, mDeets, ty, docsNS));
                    knownEnums.add(mDeets.e.n)
                }
                addToProps(ConvertNadeoTypeProp(key, mDeets));
            }
            else if (isFunc)
                addToMethods(ConvertNadeoTypeMethod(key, mDeets));
            else if (isProp)
                addToProps(ConvertNadeoTypeProp(key, mDeets))
            else {
                console.warn(`Skipping ${ty}.${key}!`)
            }
        }
    }

    // add enums -- these seem bugged compared to when converted from elsewhere
    if (tyDeets.e) { // enums defined under type
        for (let e of tyDeets.e) {
            if (!knownEnums.has(e.n)) {
                ret.enums.push(...ConvertNadeoTypeEnum(e.n, {e, t: `${ty}::${e.n}`}, ret.name, docsNS))
                knownEnums.add(e.n);
            }
        }
    }

    // add docs
    if (tyDeets.d) {
        if (tyDeets.d.d) ret.desc = tyDeets.d.d;
        if (tyDeets.d.o) {
            for (let [ix, doc, warn, unk] of tyDeets.d.o) {
                allAddedMembers.filter((v) => v.i == ix).forEach(m => {
                    let prefix = (warn <= 0) ? "" : (warn == 1 ? "Warning: " : "" /*unknown when ==2*/)
                    m.desc = `${prefix}${doc}`
                    // console.log(`Added docs to ${ty}.${m.name}: ${doc}`)
                })
            }
        }
    }

    let docsLink = `Docs: <https://next.openplanet.dev/${docsNS}/${ty}>`;
    if (ret.desc.length == 0) ret.desc = docsLink;
    else ret.desc = [ret.desc, docsLink].join('\n\n')

    return ret;
}

export function GenerateOpDocsLink(typeName: string) {
    let clean = CleanTypeName(typeName)
    return `Docs: <https://next.openplanet.dev/${NadeoTypesToDocsNS.get(clean)}/${clean}>`;
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
    return { name, returntypedecl, args, i: deets.i, isEnum: false };
}
export function ConvertNadeoTypeProp(name: string, deets: any): CoreProperty {
    return { name, typedecl: deets.t, i: deets.i, isEnum: false };
}

export function ConvertNadeoTypeBehaviour(name: string, deets: any) {} // this is constructor destructor stuff, which I don't think we ever need

export function ConvertNadeoTypeEnum(propName: string, deets: any, parentClass: string, docsNS: string): CoreEnum[] {
    let name = deets['t'];
    let nameNoNS: string = deets['e']['n']; // this is the type name but without the namespace
    let ns: string = "";
    let ret: CoreEnum[] = [];
    if (!name.startsWith(parentClass)) {
        // if '::' isn't part of the enum name, we'll return 2 enums. One in global NS and one in class NS
        ret.push(...ConvertNadeoTypeEnum(propName, {...deets, t: `${parentClass}::${name}`}, parentClass, docsNS))
    } else {
        let parts = name.split("::");
        name = parts[parts.length - 1];
        ns = parts.slice(0, parts.length - 1).join("::");
    }
    let desc = `Docs: <https://next.openplanet.dev/${docsNS}/${parentClass}#${name}>`;
    let v: string[] = deets['e']['v'];
    let values: Record<string, number> = {};
    v.forEach((s, i) => values[s] = i)
    ret.push({name, ns, desc, values, isEnum: true});
    // if (parentClass == "CSceneVehicleVisState") console.log(JSON.stringify(ret))
    return ret;
}
