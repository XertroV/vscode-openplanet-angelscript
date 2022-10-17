(function () {

let i = 0;
// let indexed = true;
let indexed = false;

module.exports = {
    Identifier: indexed ? i++ : "Identifier",
    BinaryOperation: indexed ? i++ : "BinaryOperation",
    UnaryOperation: indexed ? i++ : "UnaryOperation",
    PostfixOperation: indexed ? i++ : "PostfixOperation",
    TernaryOperation: indexed ? i++ : "TernaryOperation",
    CastOperation: indexed ? i++ : "CastOperation",
    Assignment: indexed ? i++ : "Assignment",
    CompoundAssignment: indexed ? i++ : "CompoundAssignment",
    MemberAccess: indexed ? i++ : "MemberAccess",
    NamespaceAccess: indexed ? i++ : "NamespaceAccess",
    FunctionCall: indexed ? i++ : "FunctionCall",
    ConstructorCall: indexed ? i++ : "ConstructorCall",
    NamedArgument: indexed ? i++ : "NamedArgument",
    IndexOperator: indexed ? i++ : "IndexOperator",
    CommaExpression: indexed ? i++ : "CommaExpression",
    This: indexed ? i++ : "This",

    ConstInteger: indexed ? i++ : "ConstInteger",
    ConstHexInteger: indexed ? i++ : "ConstHexInteger",
    ConstOctalInteger: indexed ? i++ : "ConstOctalInteger",
    ConstBinaryInteger: indexed ? i++ : "ConstBinaryInteger",
    ConstFloat: indexed ? i++ : "ConstFloat",
    ConstDouble: indexed ? i++ : "ConstDouble",
    ConstString: indexed ? i++ : "ConstString",
    ConstName: indexed ? i++ : "ConstName",
    ConstFormatString: indexed ? i++ : "ConstFormatString",
    ConstBool: indexed ? i++ : "ConstBool",
    ConstNullptr: indexed ? i++ : "ConstNullptr",

    IfStatement: indexed ? i++ : "IfStatement",
    ElseStatement: indexed ? i++ : "ElseStatement",
    GetStatement: indexed ? i++ : "GetStatement",
    SetStatement: indexed ? i++ : "SetStatement",
    TryStatement: indexed ? i++ : "TryStatement",
    CatchStatement: indexed ? i++ : "CatchStatement",
    ReturnStatement: indexed ? i++ : "ReturnStatement",
    ImportStatement: indexed ? i++ : "ImportStatement",
    ImportFunctionStatement: indexed ? i++ : "ImportFunctionStatement",
    DefaultStatement: indexed ? i++ : "DefaultStatement",
    SwitchStatement: indexed ? i++ : "SwitchStatement",
    CaseStatement: indexed ? i++ : "CaseStatement",
    DefaultCaseStatement: indexed ? i++ : "DefaultCaseStatement",
    ContinueStatement: indexed ? i++ : "ContinueStatement",
    BreakStatement: indexed ? i++ : "BreakStatement",

    StructDefinition: indexed ? i++ : "StructDefinition",
    ClassDefinition: indexed ? i++ : "ClassDefinition",
    EnumDefinition: indexed ? i++ : "EnumDefinition",
    ArrayInline: indexed ? i++ : "ArrayInline",
    AssetDefinition: indexed ? i++ : "AssetDefinition",
    NamespaceDefinition: indexed ? i++ : "NamespaceDefinition",
    FuncdefDefinition: indexed ? i++ : "FuncdefDefinition",

    SettingDeclaration: indexed ? i++ : "SettingDeclaration",
    SettingKwarg: indexed ? i++ : "SettingKwarg",
    SettingsTabDeclaration: indexed ? i++ : "SettingsTabDeclaration",
    SettingsTabKwarg: indexed ? i++ : "SettingsTabKwarg",

    VariableDecl: indexed ? i++ : "VariableDecl",
    VariableDeclMulti: indexed ? i++ : "VariableDeclMulti",
    FunctionDecl: indexed ? i++ : "FunctionDecl",
    InlineFunctionDecl: indexed ? i++ : "InlineFunctionDecl",
    // DelegateDecl: indexed ? i++ : "DelegateDecl",
    // EventDecl: indexed ? i++ : "EventDecl",
    ConstructorDecl: indexed ? i++ : "ConstructorDecl",
    DestructorDecl: indexed ? i++ : "ConstructorDecl",

    ForLoop: indexed ? i++ : "ForLoop",
    ForEachLoop: indexed ? i++ : "ForEachLoop",
    WhileLoop: indexed ? i++ : "WhileLoop",

    Typename: indexed ? i++ : "Typename",
    Parameter: indexed ? i++ : "Parameter",

    ArgumentList: indexed ? i++ : "ArgumentList",
    Argument: indexed ? i++ : "Argument",

    Macro: indexed ? i++ : "Macro",
    MacroArgument: indexed ? i++ : "MacroArgument",

    ArrayValueList: indexed ? i++ : "ArrayValueList",
    EnumValueList: indexed ? i++ : "EnumValueList",
    EnumValue: indexed ? i++ : "EnumValue",

    AccessDeclaration: indexed ? i++ : "AccessDeclaration",
    AccessClass: indexed ? i++ : "AccessClass",
    IncompleteAccessSpecifier: indexed ? i++ : "IncompleteAccessSpecifier",
}

})();
