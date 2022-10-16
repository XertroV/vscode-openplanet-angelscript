export class TypeCounter {
    functions: number = 0;
    enums: number = 0;
    classes: number = 0;
    methods: number = 0;
    properties: number = 0;
    constructor() {}
    CountType(ty: string, nbToAdd = 1) {
        if (!nbToAdd) nbToAdd = 0; // if null/undefined gets passed in it's probs b/c something doesn't exist
        if (ty.startsWith("function")) this.functions += nbToAdd;
        else if (ty.startsWith("class")) this.classes += nbToAdd;
        else if (ty.startsWith("method")) this.methods += nbToAdd;
        else if (ty.startsWith("property")) this.properties += nbToAdd;
        else if (ty.startsWith("properties")) this.properties += nbToAdd;
        else if (ty.startsWith("enum")) this.enums += nbToAdd;
        else throw `Cannot count unknown type: ${ty}`
    }
    ToString() {
        return `Functions: ${this.functions}, Classes: ${this.classes}, Methods: ${this.methods}, Properties: ${this.properties}, Enums: ${this.enums}`;
    }
}
