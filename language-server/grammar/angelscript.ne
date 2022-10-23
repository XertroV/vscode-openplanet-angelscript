@{%

const moo = require("moo");
const n = require("./node_types");

const lexer = moo.compile({
    line_comment: { match: /\/\/.*?$/ },
    preprocessor_statement: { match: /#.*?$/ },
    block_comment: { match: /\/\*[^]*?\*\//, lineBreaks: true },
    WS:      { match: /[ \t\r\n]+/, lineBreaks: true },
    lparen:  '(',
    rparen:  ')',
    lsqbracket:  '[',
    rsqbracket:  ']',
    lbrace:  '{',
    rbrace:  '}',
    dot: ".",
    semicolon: ";",
    ns: "::",
    colon: ":",
    comma: ",",
    atsign: "@",
    postfix_operator: ["++", "--"],
    compound_assignment: ["+=", "-=", "/=", "*=", "**=", "~=", "^=", "|=", "&=", "%=", "<<=", ">>=", ">>>="],
    op_binary_logic: ['&&', '||'],
    op_binary_sum: ['+', '-'],
    op_binary_product: ['*', '/', '%', '**'],
    // note: removed `>>` from op_binary_compare; causes bug with cast<array<X>>
    op_binary_compare: ["==", "!=", "<=", ">=", "is ", "!is "], // add spaces around `is` to avoid detecting `a isb` as `a is b`
    lt: "<",
    gt: ">",
    op_binary_bitwise: ["|", "&", "^"],
    op_assignment: "=",
    op_unary: ["!", "~"],
    ternary: "?",
    trpstring:  {
        match: /"""[^]*"""/,
        lineBreaks: true,
    },
    dqstring:  /"(?:\\["\\A-Za-z0-9]|[^\n"\\])*"/,
    sqstring:  /'(?:\\['\\A-Za-z0-9]|[^\n'\\])*'/,
    hex_number: /0[xX][0-9A-Fa-f]*/,
    octal_number: /0[oO][0-8]*/,
    binary_number: /0[bB][01]*/,
    identifier: { match: /[A-Za-z_][A-Za-z0-9_]*/,
        type: moo.keywords({
            enum_token: "enum",
            return_token: "return",
            continue_token: "continue",
            break_token: "break",
            import_token: "import",
            class_token: "class",
            interface_token: "interface",
            struct_token: "struct",
            default_token: "default",
            void_token: "void",
            const_token: "const",
            final_token: "final",
            override_token: "override",
            property_token: "property",
            mixin_token: "mixin",
            shared_token: "shared",
            funcdef_token: "funcdef",
            function_token: "function",
            local_token: "local",
            if_token: "if",
            else_token: "else",
            get_token: "get",
            set_token: "set",
            try_token: "try",
            catch_token: "catch",
            while_token: "while",
            for_token: "for",
            case_token: "case",
            switch_token: "switch",
            cast_token: "cast",
            namespace_token: "namespace",
            bool_token: ['true', 'false'],
            nullptr_token: 'null',
            this_token: 'this',
            access_token: 'access',

            // This is a hack to help disambiguate syntax.
            // A statement of `TArray<int> Var` might be parsed as
            // ((TArray < int) > Var) as well, so we hardcode the template types
            // we know to avoid this in most situations.
            template_basetype: ["array", "MwSArray", "MwFastArray", "MwFastBuffer", "MwNodPool", "MwRefBuffer"],
        })
    },
    number: /[0-9]+/,
});

// A compound node containing multiple child nodes
function Compound(d, node_type, children)
{
    let node = {
        type: node_type,
        start: -1,
        end: -1,
        children: children,
    };
    ComputeStartAndEnd(node, d);
    return node;
}

// Extend the range of the compound to the new item
function ExtendedCompound(d, node)
{
    node.start = -1;
    node.end = -1;
    ComputeStartAndEnd(node, d);
    return node;
}

// An identifier based off a single lexer token
function Identifier(token)
{
    return {
        type: n.Identifier,
        start: token.offset,
        end: token.offset + token.text.length,
        value: token.value,
    };
}

// An literal based off a single lexer token
function Literal(node_type, token)
{
    return {
        type: node_type,
        start: token.offset,
        end: token.offset + token.text.length,
        value: token.value,
    };
}

// An identifier taken from a quoted string
function IdentifierFromString(token)
{
    return {
        type: n.Identifier,
        start: token.offset + 1,
        end: token.offset + token.text.length - 1,
        value: token.value.substring(1, token.value.length-1),
    };
}

// An identifier based on multiple lexer tokens or child nodes together
function CompoundIdentifier(tokens, children)
{
    return CompoundLiteral(n.Identifier, tokens, children);
}

/** turn `thing (_ thing):*` or `(thing _):* thing` into a list of things
  extract example for `(_ thing):*`: (p) => p[1]
*/
function FromMultiple(node, nodes, extract) {
    let ret = [node];
    if (nodes) {
        for (let part of nodes) {
            ret.push(extract(part));
        }
    }
    return ret;
}

// A literal based on multiple lexer tokens or child nodes together
function CompoundLiteral(node_type, tokens, children)
{
    let node = {
        type: node_type,
        start: -1,
        end: -1,
        value: "",
        children: children,
    };

    MergeValue(node, tokens);
    return node;
}

function MergeValue(node, d)
{
    for (let part of d)
    {
        if (!part)
            continue;

        if (Array.isArray(part))
        {
            MergeValue(node, part);
        }
        else if (part.hasOwnProperty("offset"))
        {
            // This is a token
            if (node.start == -1)
                node.start = part.offset;
            node.end = part.offset + part.text.length;
            node.value += part.value;
        }
        else if (part.hasOwnProperty("start"))
        {
            // This is a node
            if (node.start == -1)
                node.start = part.start;
            node.end = part.end;
            node.value += part.value;
        }
    }
}

function ComputeStartAndEnd(node, d)
{
    for (let part of d)
    {
        if (!part)
            continue;

        if (Array.isArray(part))
        {
            ComputeStartAndEnd(node, part);
        }
        else if (part.hasOwnProperty("offset"))
        {
            // This is a token
            if (node.start == -1)
                node.start = part.offset;
            node.end = part.offset + part.text.length;
        }
        else if (part.hasOwnProperty("start"))
        {
            // This is a node
            if (node.start == -1)
                node.start = part.start;
            node.end = part.end;
        }
    }
}

// Operator type node
function Operator(token)
{
    return token.value;
}

function GetFirstValue(thing) {
    return Array.isArray(thing) ? GetFirstValue(thing[0]) : thing;
}

// todo: shouldn't need this if it's coded better
function RemoveOuterArrays(thing) {
    if (Array.isArray(thing) && thing.length == 1) {
        return RemoveOuterArrays(thing[0]);
    }
    if (!Array.isArray(thing)) return [thing];
    return thing;
}

function MkSettingKwarg(d, node_type = n.SettingKwarg) {
    let d_inner = RemoveOuterArrays(d);
    let hasArg = !!d_inner[1];
    // console.log(JSON.stringify(d_inner)) // todo: debug settings array structure stuff to avoid needing remove outer arrays
    let children = (hasArg ? [d_inner[0], d_inner[2]] : [d_inner[0]]).map(GetFirstValue);
    // console.log(JSON.stringify(children)) // todo: debug settings array structure stuff to avoid needing remove outer arrays
    return {
        ...Compound(d, node_type, children),
        hasArg
    };
}

function MkSettingsTabKwarg(d) {
    return MkSettingKwarg(d, n.SettingsTabKwarg)
}


%}

@lexer lexer

optional_statement -> null {%
    function (d) { return null; }
%}
optional_statement -> _ statement {%
    function (d) { return d[1]; }
%}

optional_expression -> null {%
    function (d) { return null; }
%}
optional_expression -> _ expression {%
    function (d) { return d[1]; }
%}

statement -> expression {% id %}
statement -> assignment {% id %}
statement -> var_decl {% id %}

assignment -> lvalue _ "=" _ expression_or_assignment {%
    function (d) { return Compound(d, n.Assignment, [d[0], d[4]]); }
%}
assignment -> lvalue _ %compound_assignment _ expression_or_assignment {%
    function (d) { return {
        ...Compound(d, n.CompoundAssignment, [d[0], d[4]]),
        operator: Operator(d[2]),
    }; }
%}

expression_or_assignment -> expression {% id %}
expression_or_assignment -> assignment {% id %}

expression_or_assignment_or_var_decl -> expression_or_assignment {% id %}
expression_or_assignment_or_var_decl -> var_decl {% id %}
expression_or_assignment_or_var_decl -> statement {% id %}

statement -> %if_token _ %lparen (_ expression_or_assignment):? _ %rparen optional_statement {%
    function (d)
    {
        if (d[3])
            return Compound(d, n.IfStatement, [d[3][1], d[6]]);
        else
            return Compound(d, n.IfStatement, [null, d[6]]);
    }
%}

statement -> %return_token _ expression_or_assignment {%
    function (d) { return Compound(d, n.ReturnStatement, [d[2]]); }
%}

statement -> %return_token {%
    function (d) { return Compound(d, n.ReturnStatement, []); }
%}

statement -> %else_token optional_statement {%
    function (d) { return Compound(d, n.ElseStatement, [d[1]]); }
%}

statement -> %get_token _ {% d => Compound(d, n.GetStatement, []) %}
statement -> %set_token _ {% d => Compound(d, n.SetStatement, []) %}

statement -> %try_token {% d => Compound(d, n.TryStatement, []) %}
statement -> %catch_token {% d => Compound(d, n.CatchStatement, []) %}

statement -> %switch_token _ %lparen optional_expression _ %rparen {%
    function (d) { return Compound(d, n.SwitchStatement, [d[3]]); }
%}

statement -> %case_token _ case_label _ %colon optional_statement {%
    function (d) { return {
            ...Compound(d, n.CaseStatement, [d[2], d[5]]),
            has_statement: true,
        }
    }
%}

statement -> %case_token _ %identifier {%
    function (d) { return Compound(d, n.CaseStatement, [Identifier(d[2]), null]); }
%}

statement -> %case_token _ %identifier _ %colon {%
    function (d) { return Compound(d, n.CaseStatement, [{
        ...Compound(d, n.NamespaceAccess, [Identifier(d[2]), null]),
        incomplete_colon: true,
    }, null]); }
%}

statement -> %case_token _ %identifier _ %ns {%
    function (d) { return Compound(d, n.CaseStatement, [{
        ...Compound(d, n.NamespaceAccess, [Identifier(d[2]), null]),
    }, null]); }
%}

statement -> %case_token _ case_label {%
    function (d) { return Compound(d, n.CaseStatement, [d[2], null]); }
%}

statement -> %default_token %colon optional_statement {%
    function (d) { return Compound(d, n.DefaultCaseStatement, [d[2]]); }
%}

statement -> %continue_token {%
    function (d) { return Literal(n.ContinueStatement, d[0]); }
%}

statement -> %break_token {%
    function (d) { return Literal(n.BreakStatement, d[0]); }
%}

statement -> %for_token _ %lparen (_ for_declaration):? (_ %semicolon optional_expression (_ %semicolon for_comma_expression_list):?):? _ %rparen optional_statement {%
    function (d) {
        return Compound(d, n.ForLoop,
            [d[3] ? d[3][1] : null,
            d[4] ? d[4][2] : null,
            d[4] && d[4][3] ? d[4][3][2] : null,
            d[7]]);
    }
%}

for_declaration -> var_decl {% id %}
for_declaration -> expression {% id %}
for_declaration -> assignment {% id %}

for_comma_expression_list -> null {%
    function (d) { return null; }
%}
for_comma_expression_list -> _ for_comma_expression {%
    function (d) { return d[1]; }
%}
for_comma_expression_list -> _ for_comma_expression (_ "," _ for_comma_expression):+ {%
    function (d) {
        exprs = [d[1]];
        for (let part of d[2])
            exprs.push(part[3]);
        return Compound(d, n.CommaExpression, exprs);
    }
%}
for_comma_expression -> expression {% id %}
for_comma_expression -> assignment {% id %}

# seems to be `for(int a : ListOfA)` or something
# statement -> %for_token _ %lparen _ typename _ %identifier _ %colon optional_expression _ %rparen optional_statement {%
#     function (d) { return Compound(d, n.ForEachLoop, [d[4], Identifier(d[6]), d[9], d[12]]); }
# %}

statement -> %while_token _ %lparen optional_expression _ %rparen optional_statement {%
    function (d) { return Compound(d, n.WhileLoop, [d[3], d[6]]); }
%}

global_statement -> %import_token {%
    function (d) {
        return Compound(d, n.ImportStatement, [null]);
    }
%}

global_statement -> %import_token _ %identifier (%dot %identifier):* %dot:? {%
    function (d) {
        let tokens = [d[2]];
        for (let part of d[3])
        {
            tokens.push(part[0]);
            tokens.push(part[1]);
        }
        if (d[4])
            tokens.push(d[4]);
        return Compound(d, n.ImportStatement, [CompoundIdentifier(tokens, null)]);
    }
%}
global_statement -> %import_token _ function_decl _ "from" _ (%dqstring | %sqstring) {%
    function (d) {
        return Compound(d, n.ImportFunctionStatement, [d[2], IdentifierFromString(d[6][0])]);
    }
%}

global_declaration -> function_decl {% id %}
global_declaration -> (settings_decl _):? var_decl {%
    function (d) { /* console.log(d); */ return {
        ...d[1], setting: d[0] ? d[0][0] : null
    }; }
%}
# e.g., an unfinished settings declaration
global_declaration -> settings_decl {%
    d => ({
        ...Compound(d, n.VariableDecl, null),
        setting: d[0],
    })
%}
global_declaration -> typename {%
    function (d) { return {
        ...Compound(d, n.VariableDecl, null),
        name: null,
        typename: d[0],
    }; }
%}

global_declaration -> (%shared_token _):? (%class_token | %interface_token) _ atref:? %identifier ( _ %colon):? (_ typename_identifier):? {%
    function (d) { return {
        ...Compound(d, n.ClassDefinition, null),
        name: Identifier(d[4]),
        // superclass: d[6] ? Identifier(d[6][1]) : null,
        superclass: d[6] ? d[6][1] : null,
        is_shared: !!d[0],
    }}
%}
global_declaration -> (%shared_token _):? %enum_token _ %identifier {%
    function (d) { return {
        ...Compound(d, n.EnumDefinition, null),
        name: Identifier(d[3]),
        is_shared: !!d[0],
    }}
%}
global_declaration -> (%shared_token _):? %funcdef_token _ function_signature {%
    function (d) { return {
        ...Compound(d, n.FuncdefDefinition, [d[3]]),
        name: d[3].name,
        is_shared: !!d[0],
    }}
%}

# global_declaration -> "asset" _ %identifier _ "of" _ typename {%
#     function (d) { return {
#         ...Compound(d, n.AssetDefinition, null),
#         name: Identifier(d[2]),
#         typename: d[6],
#     }; }
# %}

# # todo
# global_declaration -> "settings" _ %identifier _ "for" _ typename {%
#     function (d) { return {
#         ...Compound(d, n.AssetDefinition, null),
#         name: Identifier(d[2]),
#         typename: d[6],
#     }; }
# %}

namespace_definition_name -> %identifier (_ %ns _ %identifier):* {%
    function (d) { return CompoundIdentifier(d, null); }
%}

global_declaration -> %namespace_token _ namespace_definition_name {%
    function (d) { return {
        ...Compound(d, n.NamespaceDefinition, null),
        name: d[2],
    }; }
%}

# should settings_decl be here?
class_declaration -> (settings_decl _):? (access_specifier _):? var_decl {%
    function (d) {
        return ExtendedCompound(d, {
            ...d[2],
            access: d[1] ? d[1][0] : null,
            setting: d[0] ? d[0][0] : null,
        });
    }
%}
class_declaration -> (access_specifier _):? typename {%
    function (d) {
        return ExtendedCompound(d, {
            ...Compound(d, n.VariableDecl, null),
            name: null,
            typename: d[1],
            access: d[0] ? d[0][0] : null,
        });
    }
%}

class_declaration -> (access_specifier _):? function_signature {%
    function (d) {
        return ExtendedCompound(d, {
            ...d[1],
            access: d[0] ? d[0][0] : null,
        });
    }
%}

class_declaration -> access_specifier _ function_signature {%
    function (d) {
        return ExtendedCompound(d, {
            ...d[2],
            access: d[0],
        });
    }
%}

class_declaration -> constructor_decl {% id %}
class_declaration -> destructor_decl {% id %}

class_statement -> %default_token _ expression {%
    function (d) { return Compound(d, n.DefaultStatement, [d[2]]); }
%}
class_statement -> %default_token _ assignment {%
    function (d) { return Compound(d, n.DefaultStatement, [d[2]]); }
%}
class_statement -> access_declaration {%
    function (d) { return d[0]; }
%}

access_declaration -> %access_token _ %identifier _ %op_assignment _ access_list {%
    function (d) {
        return {
            ...Compound( d, n.AccessDeclaration, null),
            name: Identifier(d[2]),
            classList: d[6],
        };
    }
%}
access_declaration -> %access_token _ %identifier (_ %op_assignment):? {%
    function (d) {
        return {
            ...Compound( d, n.AccessDeclaration, null),
            name: Identifier(d[2]),
            classList: [],
        };
    }
%}

access_list -> null {%
    function(d) { return []; }
%}
access_list -> access_class (_ "," _ access_class):* (_ %comma):? {%
    function(d) {
        let args = [d[0]];
        if (d[1])
        {
            for (let part of d[1])
                args.push(part[3]);
        }
        return args;
    }
%}
access_class -> (%identifier | "*") (_ %lparen _ access_mod_list _ %rparen):? {%
    function (d) {
        return {
            ...Compound( d, n.AccessClass, null),
            className: Identifier(d[0][0]),
            mods: d[1] ? d[1][3] : null,
        };
    }
%}

access_mod_list -> null {%
    function(d) { return []; }
%}
access_mod_list -> %identifier (_ "," _ %identifier):* (_ %comma):? {%
    function(d) {
        let args = [d[0]];
        if (d[1])
        {
            for (let part of d[1])
                args.push(Identifier(part[3]));
        }
        return args;
    }
%}

mb_ref_identifier -> atref:? %identifier {%
    function (d) { return {
        ...ExtendedCompound(d, Identifier(d[1])),
        is_reference: !!d[0],
    }; }
%}

# scoped_getter_setter ->
# scoped_getter_setter:?

var_decl -> typename _ mb_ref_identifier {%
    function (d) { return {
        ...Compound(d, n.VariableDecl, null),
        name: d[2],
        typename: d[0],
    }; }
%}
var_decl -> typename _ mb_ref_identifier _ "=" (_ expression):? {%
    function (d) { return {
        ...Compound(d, n.VariableDecl, null),
        name: d[2],
        typename: d[0],
        expression: d[5] ? d[5][1] : null,
        inline_assignment: d[5] ? true : false,
    }; }
%}
var_decl -> typename _ %identifier _ %lparen argumentlist _ %rparen {%
    function (d) { return {
        ...Compound(d, n.VariableDecl, null),
        name: Identifier(d[2]),
        typename: d[0],
        expression: d[5],
        inline_constructor: true,
    }; }
%}

var_decl -> typename _ var_decl_multi_part (_ %comma _ var_decl_multi_part):+ {%
    function (d) {
        let vars = [d[2]];
        vars[0].typename = d[0];
        if (d[3])
        {
            for (let part of d[3])
            {
                part[3].is_secondary = true;
                part[3].typename = d[0];
                vars.push(part[3]);
            }
        }

        return Compound(d, n.VariableDeclMulti, vars);
    }
%}

var_decl_multi_part -> %identifier (_ "=" _ expression):? {%
    function (d) {
        if (d[1])
            return {
                ...Compound(d, n.VariableDecl, null),
                name: Identifier(d[0]),
                expression: d[1][3],
                inline_assignment: true
            };
        else
            return {
                ...Compound(d, n.VariableDecl, null),
                name: Identifier(d[0]),
                expression: null,
            };
    }
%}

function_decl -> (%shared_token _):? function_signature {% function(d) { return d[1]; } %}

constructor_decl -> %identifier _ %lparen _ parameter_list _ %rparen {%
    function (d) { return {
        ...Compound(d, n.ConstructorDecl, null),
        name: Identifier(d[0]),
        parameters: d[4],
    }; }
%}
destructor_decl -> "~" %identifier _ %lparen _ %rparen {%
    function (d) { return {
        ...Compound(d, n.DestructorDecl, null),
        name: CompoundIdentifier([d[0], d[1]]),
    }; }
%}

function_signature -> function_return _ %identifier _ %lparen _ parameter_list _ %rparen func_qualifiers {%
    function (d) { return {
        ...Compound(d, n.FunctionDecl, null),
        name: Identifier(d[2]),
        returntype: d[0],
        parameters: d[6],
        qualifiers: d[9],
    }; }
%}

# INCOMPLETE: Typing a function declaration with only the void token
function_signature -> %void_token _ %identifier {%
    function (d) { return {
        ...Compound(d, n.FunctionDecl, null),
        name: Identifier(d[2]),
        returntype: d[0],
        parameters: [],
        qualifiers: [],
    }; }
%}

function_return -> typename {% id %}
function_return -> %void_token {%
    function (d) { return null; }
%}

parameter_list -> null {%
    function(d) { return []; }
%}
parameter_list -> (%comma _):? parameter (_ %comma _ parameter):* (_ %comma):? {%
    function(d) {
        let params = [];
        if (d[1])
            params.push(d[1]);
        if (d[2])
        {
            for (let part of d[2])
            {
                if (part[3])
                    params.push(part[3]);
            }
        }
        return params;
    }
%}

# INCOMPLETE: Typing a const token
parameter -> %const_token {%
    function (d) { return null; }
%}

parameter -> typename {%
    function (d) { return {
        ...Compound(d, n.Parameter, null),
        typename: d[0],
    }; }
%}

parameter -> typename _ %identifier {%
    function (d) { return {
        ...Compound(d, n.Parameter, null),
        typename: d[0],
        name: Identifier(d[2]),
    }; }
%}

parameter -> typename _ %identifier _ "=" optional_expression {%
    function (d) { return {
        ...Compound(d, n.Parameter, null),
        typename: d[0],
        name: Identifier(d[2]),
        expression: d[5],
    }; }
%}

macro_list -> null {%
    function(d) { return []; }
%}
macro_list -> macro_argument (_ "," _ macro_argument):* (_ %comma):? {%
    function(d) {
        let args = [d[0]];
        if (d[1])
        {
            for (let part of d[1])
                args.push(part[3]);
        }
        return args;
    }
%}

macro_argument -> macro_identifier {%
    function (d) { return {
        ...Compound(d, n.MacroArgument, null),
        name: d[0],
    }; }
%}
macro_argument -> macro_identifier _ "=" _ macro_value {%
    function (d) { return {
        ...Compound(d, n.MacroArgument, null),
        name: d[0],
        value: d[4],
    }; }
%}
macro_argument -> macro_identifier _ "=" _ %lparen _ macro_list _ %rparen {%
    function (d) { return {
        ...Compound(d, n.MacroArgument, d[6]),
        name: d[0],
    }; }
%}

macro_identifier -> %identifier {%
    function (d) { return Identifier(d[0]); }
%}
macro_identifier -> %dqstring {%
    function (d) { return IdentifierFromString(d[0]); }
%}
macro_identifier -> %sqstring {%
    function (d) { return IdentifierFromString(d[0]); }
%}

macro_value -> macro_identifier {% id %}
macro_value -> (%identifier _ "|" _):+ %identifier {%
    function (d) {
        return CompoundIdentifier(d, null);
    }
%}

macro_value -> (%identifier _ %ns _):+ %identifier {%
    function (d) {
        return CompoundIdentifier(d, null);
    }
%}

macro_value -> ("-" _):? %bool_token {%
    function (d) {
        return Identifier(d[1]);
    }
%}

macro_value -> ("-" _):? const_number {%
    function (d) {
        if (!d[0])
            return d[1];
        return CompoundLiteral(
            d[1].type,
            d,
            null
        );
    }
%}

# expression -> lvalue {% id %}
expression -> expr_ternary {% id %}
expression -> expr_array {% id %}
expression -> expr_inline_function {% id %}

expr_array -> %lbrace argumentlist _ %rbrace {%
    function(d) { return Compound(d, n.ArrayInline, d[1] ? [d[1]] : []); }
%}

expr_ternary -> expr_binary_logic _ %ternary _ expr_ternary _ %colon _ expr_ternary {%
    function (d) { return Compound(d, n.TernaryOperation, [d[0], d[4], d[8]]); }
%}
expr_ternary -> expr_binary_logic {% id %}

expr_binary_logic -> expr_binary_logic _ %op_binary_logic (_ expr_binary_bitwise):? {%
    function (d) { return {
        ...Compound(d, n.BinaryOperation, [d[0], d[3] ? d[3][1] : null]),
        operator: Operator(d[2]),
    };}
%}
expr_binary_logic ->  expr_binary_ushr {% id %}

expr_binary_ushr -> expr_binary_ushr _ (%gt %gt %gt) (_ expr_binary_bitwise) {%
    function (d) { return {
        ...Compound(d, n.BinaryOperation, [d[0], d[3] ? d[3][1] : null]),
        operator: Operator(CompoundLiteral('', d[2])),
    };}
%}

expr_binary_ushr -> expr_binary_bitwise {% id %}

op_binary_bitwise -> (%op_binary_bitwise | %gt %gt | %lt %lt) {%
    function(d) {
        return CompoundLiteral('', d);
    }
%}

expr_binary_bitwise -> expr_binary_bitwise _ op_binary_bitwise (_ expr_binary_compare):? {%
    function (d) { return {
        ...Compound(d, n.BinaryOperation, [d[0], d[3] ? d[3][1] : null]),
        operator: Operator(d[2]),
    };}
%}
expr_binary_bitwise -> expr_binary_compare {% id %}

op_binary_compare -> (%op_binary_compare | "<" | ">") {% function (d) { return d[0][0]; } %}

expr_binary_compare -> expr_binary_compare _ op_binary_compare (_ expr_binary_sum):? {%
    function (d) { return {
        ...Compound(d, n.BinaryOperation, [d[0], d[3] ? d[3][1] : null]),
        operator: Operator(d[2]),
    };}
%}
expr_binary_compare -> expr_binary_sum {% id %}

expr_binary_sum -> expr_binary_sum _ %op_binary_sum (_ expr_binary_product):? {%
    function (d) { return {
        ...Compound(d, n.BinaryOperation, [d[0], d[3] ? d[3][1] : null]),
        operator: Operator(d[2]),
    };}
%}
expr_binary_sum -> expr_binary_product {% id %}

expr_binary_product -> expr_binary_product _ %op_binary_product (_ expr_unary):? {%
    function (d) { return {
        ...Compound(d, n.BinaryOperation, [d[0], d[3] ? d[3][1] : null]),
        operator: Operator(d[2]),
    };}
%}
expr_binary_product -> expr_unary {% id %}

expr_unary -> unary_operator _ expr_unary {%
    function (d) { return {
        ...Compound(d, n.UnaryOperation, [d[2]]),
        operator: Operator(d[0]),
    };}
%}
expr_unary -> expr_postfix {% id %}

expr_postfix -> expr_postfix _ %postfix_operator {%
    function (d) { return {
        ...Compound(d, n.PostfixOperation, [d[0]]),
        operator: Operator(d[2]),
    };}
%}

# INCOMPLETE: match the ! while we're typing !=
expr_postfix -> expr_leaf "!":? {%
    function (d) { return d[0]; }
%}

expr_leaf -> lvalue {% id %}
expr_leaf -> constant {% id %}

# INCOMPLETE: a unary operator where we haven't typed an operand yet
expr_leaf -> unary_operator {%
    function (d) { return {
        ...Compound(d, n.UnaryOperation, []),
        operator: Operator(d[0]),
    };}
%}

lvalue -> lvalue_inner {% id %}
lvalue -> atref lvalue_inner {%
    function(d) {
        return ExtendedCompound(d, {...d[1], is_reference: true});
    }
%}

lvalue_inner -> %identifier {%
    function(d, l) { return Identifier(d[0]); }
%}

lvalue_inner -> %this_token {%
    function (d) { return Literal(n.This, d[0]); }
%}

lvalue_inner -> lvalue_inner _ %dot _ %identifier {%
    function (d) { return Compound(d, n.MemberAccess, [d[0], Identifier(d[4])]); }
%}
lvalue_inner -> %lparen _ expression _ %rparen {%
    function (d) {
        if (!d[2])
            return null;
        if (d[2].type == n.Identifier)
            return d[2];
        else
            return ExtendedCompound(d, {
                ...d[2],
            });
    }
%}
lvalue_inner -> lvalue_inner _ %lparen argumentlist _ %rparen {%
    function (d) { return Compound(d, n.FunctionCall, [d[0], d[3]]); }
%}
lvalue_inner -> lvalue_inner _ %lsqbracket optional_expression _ %rsqbracket {%
    function (d) { return Compound(d, n.IndexOperator, [d[0], d[3]]); }
%}
lvalue_inner -> template_typename _ %lparen argumentlist _ %rparen {%
    function (d) { return Compound(d, n.ConstructorCall, [d[0], d[3]]); }
%}

lvalue_inner -> %cast_token _ "<" _ typename _ ">" _ %lparen optional_expression _ %rparen {%
    function (d) { return Compound(d, n.CastOperation, [d[4], d[9]]); }
%}
# INCOMPLETE: Attempts to parse an incomplete cast while the user is typing
expression -> %cast_token (_ "<"):? {%
    function (d) { return Compound(d, n.CastOperation, [null, null]); }
%}
expression -> %cast_token _ "<" _ typename (_ ">"):? {%
    function (d) { return Compound(d, n.CastOperation, [d[4], null]); }
%}

lvalue_inner -> namespace_access {% id %}
namespace_access -> namespace_access _ %ns _ %identifier {%
    function (d) { return Compound(d, n.NamespaceAccess, [d[0], Identifier(d[4])]); }
%}
namespace_access -> %identifier _ %ns _ %identifier {%
    function (d) { return Compound(d, n.NamespaceAccess, [Identifier(d[0]), Identifier(d[4])]); }
%}
namespace_access -> %ns _ %identifier {%
    function (d) { return Compound(d, n.NamespaceAccess, [null, Identifier(d[2])]); }
%}

# INCOMPLETE: Attempts to parse an incomplete namespace access while the user is typing
lvalue_inner -> %identifier _ %ns {%
    function (d) { return Compound(d, n.NamespaceAccess, [Identifier(d[0]), null]); }
%}
# INCOMPLETE: Attempts to parse an incomplete namespace access while the user is typing
lvalue_inner -> namespace_access _ %ns {%
    function (d) { return Compound(d, n.NamespaceAccess, [d[0], null]); }
%}
# INCOMPLETE: Attempts to parse an incomplete namespace access while the user is typing
lvalue_inner -> %identifier _ ":" {%
    function (d) { return {
        ...Compound(d, n.NamespaceAccess, [Identifier(d[0]), null]),
        incomplete_colon: true
     } }
%}
# INCOMPLETE: Attempts to parse an incomplete namespace access while the user is typing
lvalue_inner -> namespace_access _ ":" {%
    function (d) { return {
        ...Compound(d, n.NamespaceAccess, [d[0], null]),
        incomplete_colon: true
     } }
%}

# INCOMPLETE: Attempts to parse an incomplete member access while the user is typing
lvalue_inner -> lvalue_inner _ %dot {%
    function (d) { return Compound(d, n.MemberAccess, [d[0], null]); }
%}
# INCOMPLETE: Attempts to parse an incomplete bracketed expression
lvalue_inner -> %lparen _ %rparen {%
    function (d) { return null; }
%}
# INCOMPLETE: Attempts to parse an incomplete assignment while the user is typing
assignment -> lvalue _ "=" {%
    function (d) { return Compound(d, n.Assignment, [d[0], null]); }
%}
assignment -> lvalue _ %compound_assignment {%
    function (d) { return {
        ...Compound(d, n.CompoundAssignment, [d[0], null]),
        operator: Operator(d[2]),
    }; }
%}


argumentlist -> null {%
    function(d) { return null; }
%}
argumentlist -> _ %comma {%
    function(d) { return null; }
%}
argumentlist -> _ (%comma _):* (argument _ (%comma _):+ ):* argument (_ %comma):* {%
    function(d) {
        let args = [];
        if (d[2])
        {
            for (let part of d[2])
                args.push(part[0]);
        }
        args.push(d[3]);
        return Compound(d, n.ArgumentList, args);
    }
%}

argument -> expression {% id %}
argument -> %identifier _ "=" optional_expression {%
    function (d) { return Compound(d, n.NamedArgument, [Identifier(d[0]), d[3]]); }
%}

# INCOMPLETE: We might be typing a named argument in front of an expression,
# but we haven't typed the = yet
argument -> %identifier %WS expr_leaf {%
    function (d) { return Compound(d, n.NamedArgument, [Identifier(d[0]), d[2]]); }
%}

expr_inline_function -> %function_token _ %lparen _ parameter_list _ %rparen a_complete_scope {%
    function (d) {
        // console.trace(`got inline function: ${JSON.stringify(d)}`)
        return {
            ...Compound(d, n.InlineFunctionDecl, null),
            //name: Identifier({...d[0], value: `__anon_func_inline`}), // Identifier(d[0]),
            name: null,
            returntype: null,
            parameters: d[4],
            qualifiers: null,
            inline_body: d[8] ? d[8] : null,
        };
    }
%}
expr_inline_function -> %function_token _ %lparen _ parameter_list _ %rparen {%
    function (d) {
        // console.trace(`got inline function: ${JSON.stringify(d)}`)
        return {
            ...Compound(d, n.InlineFunctionDecl, null),
            //name: Identifier({...d[0], value: `__anon_func_inline`}), // Identifier(d[0]),
            name: null,
            returntype: null,
            parameters: d[4],
            qualifiers: null,
            inline_body: d[8] ? d[8] : null,
        };
    }
%}

a_complete_scope -> _ %lbrace _ %rbrace {% d => { return []; } %}
a_complete_scope -> _ %lbrace _ %semicolon:? _ expression_or_assignment_or_var_decl (_ %semicolon _ expression_or_assignment_or_var_decl):* _ %semicolon:? _ %rbrace {%
    d => { return []; }
%}

const_number -> %number {%
    function(d) { return Literal(n.ConstInteger, d[0]); }
%}

const_number -> %hex_number {%
    function(d) { return Literal(n.ConstHexInteger, d[0]); }
%}

const_number -> %binary_number {%
    function(d) { return Literal(n.ConstBinaryInteger, d[0]); }
%}

const_number -> %octal_number {%
    function(d) { return Literal(n.ConstOctalInteger, d[0]); }
%}

const_number -> %number "." %number "e" "-" %number {%
    function(d) { return CompoundLiteral(n.ConstFloat, d, null); }
%}

const_number -> %number "." %number "e" %number {%
    function(d) { return CompoundLiteral(n.ConstFloat, d, null); }
%}

const_number -> %number "." %number "f" {%
    function(d) { return CompoundLiteral(n.ConstFloat, d, null); }
%}

const_number -> "." %number "f" {%
    function(d) { return CompoundLiteral(n.ConstFloat, d, null); }
%}

const_number -> %number "." "f" {%
    function(d) { return CompoundLiteral(n.ConstFloat, d, null); }
%}

const_number -> %number "." %number {%
    function(d) { return CompoundLiteral(n.ConstDouble, d, null); }
%}

const_number -> "." %number {%
    function(d) { return CompoundLiteral(n.ConstDouble, d, null); }
%}

const_number -> %number "." {%
    function(d) { return CompoundLiteral(n.ConstDouble, d, null); }
%}

constant -> %dqstring {%
    function(d) { return Literal(n.ConstString, d[0]); }
%}

constant -> %dqstring _ %lsqbracket _ %number _ %rsqbracket {%
    function(d) { return Literal(n.ConstInteger, d[0]); } // `"test"[2]` -> returns uint8
%}

constant -> %trpstring {%
    function(d) { return Literal(n.ConstString, d[0]); }
%}

constant -> %sqstring {%
    function(d) { return Literal(n.ConstString, d[0]); }
%}

constant -> "n" %dqstring {%
    function(d) { return CompoundLiteral(n.ConstName, d, null); }
%}

constant -> "f" %dqstring {%
    function(d) { return CompoundLiteral(n.ConstFormatString, d, null); }
%}

constant -> const_number {% id %}

constant -> %bool_token {%
    function (d) { return Literal(n.ConstBool, d[0]); }
%}

constant -> %nullptr_token {%
    function (d) { return Literal(n.ConstNullptr, d[0]); }
%}

unary_operator -> %op_binary_sum {% id %}
unary_operator -> %op_unary {% id %}
unary_operator -> %postfix_operator {% id %}

atref -> _ %atsign {%
    (d) => { return ExtendedCompound(d, Identifier(d[1])); }
%}

typename -> const_qualifier:? unqualified_typename atref:? ref_qualifiers:? {%
    function (d) { return ExtendedCompound(d, {
        ...d[1],
        const_qualifier: d[0],
        ref_qualifier: d[3],
        is_reference: d[2],
    });}
%}
non_const_typename -> unqualified_typename atref:? ref_qualifiers:? {%
    function (d) { return ExtendedCompound(d, {
        ...d[0],
        const_qualifier: null,
        ref_qualifier: d[2],
        is_reference: d[1],
    });}
%}

unqualified_typename -> typename_identifier {%
    function (d) { return {
        ...Compound(d, n.Typename, null),
        value: d[0].value,
        name: d[0],
    }}
%}

unqualified_typename -> template_typename {% id %}

template_typename -> typename_identifier _ "<" _ ">" {%
    function (d) {
        let typename = d[0].value+"<>";
        return {
            ...Compound(d, n.Typename, null),
            value: typename,
            basetype: d[0],
            subtypes: [],
        };
    }
%}

template_typename -> template_subtype_single _ %lsqbracket _ %rsqbracket {%
    function (d) {
        let typename = "array<" + d[0][0].value + ">";
        return {
            ...Compound(d, n.Typename, null),
            value: typename,
            basetype: 'array',
            subtypes: d[0]
        }
    }
%}

template_typename -> typename_identifier _ "<" _ template_subtypes _ ">" {%
    function (d) {
        let typename = d[0].value+"<";
        for (let i = 0; i < d[4].length; ++i)
        {
            if (i != 0) typename += ",";
            typename += d[4][i].value;
        }
        typename += ">";

        return {
            ...Compound(d, n.Typename, null),
            value: typename,
            basetype: d[0],
            subtypes: d[4],
        };
    }
%}

template_typename -> typename_identifier _ "<" _ template_subtypes_unterminated _ (%gt %gt) {%
    function (d) {
        let typename = d[0].value+"<";
        for (let i = 0; i < d[4].length; ++i)
        {
            if (i != 0) typename += ",";
            typename += d[4][i].value;
        }
        typename += ">";

        return {
            ...Compound(d, n.Typename, null),
            value: typename,
            basetype: d[0],
            subtypes: d[4],
        };
    }
%}

typename_unterminated -> const_qualifier:? typename_identifier _ "<" _ template_subtypes _ {%
    function (d) {
        let typename = d[1].value+"<";
        for (let i = 0; i < d[5].length; ++i)
        {
            if (i != 0) typename += ",";
            typename += d[5][i].value;
        }
        typename += ">";

        let node = {
            ...Compound(d, n.Typename, null),
            value: typename,
            basetype: d[1],
            subtypes: d[5],
        };
        node.end += 1;
        return node;
    }
%}

template_subtype_single -> non_const_typename {%
    function (d) {
        return [d[0]];
    }
%}

template_subtypes -> typename (_ "," _ typename):* {%
    function (d) {
        let subtypes = [d[0]];
        if (d[1])
        {
            for (let part of d[1])
                subtypes.push(part[3]);
        }
        return subtypes;
    }
%}

template_subtypes_unterminated -> (typename _ "," _):* typename_unterminated {%
    function (d) {
        let subtypes = [];
        if (d[0])
        {
            for (let part of d[0])
                subtypes.push(part[0]);
        }
        subtypes.push(d[1]);
        return subtypes
    }
%}

typename_identifier -> %template_basetype {%
    function (d) { return Literal(n.Typename, d[0]); }
%}

typename_identifier -> (%ns _):? (%identifier _ %ns _ ):* %identifier atref:? {%
    function (d) { return {...CompoundLiteral(n.Typename, d.slice(0, 3), null), is_reference: d[3]}; }
%}

const_qualifier -> %const_token _ {%
    function (d) { return Identifier(d[0]); }
%}
ref_qualifiers -> _ "&" (_ ("in" | "out" | "inout")):? {%
    function (d) { return d[2] ? d[1].value+d[2][1][0].value : d[1].value; }
%}

func_qualifiers -> null {%
    function(d) { return null; }
%}
func_qualifiers -> _ (func_qualifier __ ):* func_qualifier {%
    function(d) {
        let quals = [d[2].value];
        if (d[1])
        {
            for (let part of d[1])
                quals.push(part[0].value);
        }
        return quals;
    }
%}

func_qualifier -> (%const_token | %final_token | %override_token | %property_token) {%
    function (d) { return d[0][0]; }
%}

func_qualifier -> %identifier {%
    function (d) { return d[0].value; }
%}

access_specifier -> ("private" | "protected" | "public") {%
    function (d) { return Identifier(d[0][0]); }
%}
access_specifier -> %access_token (_ %colon _ %identifier):? {%
    function (d)
    {
        if (d[1])
            return Identifier(d[1][3]);
        return null;
    }
%}

# INCOMPLETE: Incomplete access specifier
class_statement -> %access_token _ %colon (_ %identifier):? {%
    function (d) { return Compound(
        d, n.IncompleteAccessSpecifier, [
            d[3] ? Identifier(d[3][1]) : null
        ]
    ); }
%}

_ -> (%WS | %line_comment | %block_comment | %preprocessor_statement):* {%
    function (d) { return null; }
%}

__ -> %WS {%
    function (d) { return null; }
%}
__ -> _ %block_comment _ {%
    function (d) { return null; }
%}
__ -> _ %line_comment _ {%
    function (d) { return null; }
%}
__ -> _ %prepocessor_statement _ {%
    function (d) { return null; }
%}

case_label -> %lparen _ case_label _ %rparen {%
    function (d) { return d[2]; }
%}
case_label -> ("-" _):? %number {%
    function (d) {
        return CompoundLiteral(
            n.ConstInteger,
            d,
            null
        );
    }
%}
case_label -> namespace_access {% id %}

array_statement -> expression (_ %comma _ expression):* {%
    function (d) {
        let result = [d[0]];
        if (d[1]) {
            for (let sub of d[1]) {
                result.push(sub[3]);
            }
        }
        return Compound(d, n.ArrayValueList, result);
    }
%}

enum_statement -> enum_decl (_ %comma enum_decl):* (_ %comma):? {%
    function (d)
    {
        let result = [d[0]];
        if (d[1])
        {
            for (let sub of d[1])
                result.push(sub[2]);
        }
        return Compound(d, n.EnumValueList, result);
    }
%}

enum_decl -> comment_documentation:? %identifier {%
    function (d) { return {
        ...Compound(d, n.EnumValue, null),
        name: Identifier(d[1]),
        documentation: d[0],
   }; }
%}

enum_decl -> comment_documentation:? %identifier _ "=" _ expression {%
    function (d) { return {
        ...Compound(d, n.EnumValue, null),
        name: Identifier(d[1]),
        value: d[5],
        documentation: d[0],
   }; }
%}

comment_documentation -> %WS:* (%block_comment %WS:? | %line_comment %WS:? | %preprocessor_statement %WS:?):* {%
    function (d) {
        if (d[1])
        {
            let comment = null;
            for (let i = d[1].length-1; i >= 0; --i)
            {
                let part = d[1][i][0];
                if (part && part.value)
                {
                    if (part.type == 'line_comment')
                    {
                        comment = part.value.substring(2);
                        break;
                    }
                    else if (part.type == 'block_comment')
                    {
                        comment = part.value.substring(2, part.value.length-2);
                        break;
                    }
                }
            }
            return comment;
        }
        return null;
    }
%}

statement -> scuffed_template_statement (_ ">"):? {% id %}
class_statement -> scuffed_template_statement {% id %}
global_statement -> scuffed_template_statement {% id %}

scuffed_template_statement -> %template_basetype (_ "<"):? {%
    function (d) {
        let node = {
            ...Compound(d, n.VariableDecl, null),
            name: null,
            typename: {
                ...CompoundLiteral(n.Typename, [d[0]], null),
                name: Identifier(d[0]),
            },
        };
        return node;
    }
%}
scuffed_template_statement -> %template_basetype _ "<" _ typename {%
    function (d) {
        let node = {
            ...Compound(d, n.VariableDecl, null),
            name: null,
            typename: {
                ...CompoundLiteral(n.Typename, d, null),
                basetype: Identifier(d[0]),
                subtypes: [d[4]]
            },
        };
        node.typename.value += ">";
        return node;
    }
%}

settings_decl -> _ setting_var_decl {% d => d[1] %}
settings_decl -> _ setting_tab_decl {% d => d[1] %}

# todo: setting_var-decl doesn't keep the "setting" token, but i guess it's always the first 7 letters anyway after the `[`.
setting_var_decl -> %lsqbracket "Setting" _ %rsqbracket:? {% function(d) { return Compound(d, n.SettingDeclaration, []); } %}
# setting_var_decl -> %lsqbracket "Setting" _ setting_std_optional_kwargs _ %rsqbracket:? {% function(d) { return Compound(d, n.SettingDeclaration, [d[3]]); } %}
setting_var_decl -> %lsqbracket "Setting" _ setting_type_kwargs _ %rsqbracket:? {% function(d) { return Compound(d, n.SettingDeclaration, [d[3], d[5]]); } %}
# setting_var_decl -> %lsqbracket "Setting" _ setting_type_kwargs _ setting_std_optional_kwargs _ %rsqbracket:? {% function(d) { return Compound(d, n.SettingDeclaration, [d[3], d[5], d[7]]); } %}

setting_std_optional_kwarg -> "hidden" | ("name" | "category" | "description") %op_assignment (%dqstring | %sqstring) {% MkSettingKwarg %}
setting_std_optional_kwargs -> (setting_std_optional_kwarg _):* setting_std_optional_kwarg {%
    (d) => {
        let result = [d[1]];
        if (d[0])
        {
            for (let sub of d[0])
                result.push(sub[0]);
        }
        return Compound(d, n.SettingKwarg, result);
    }
%}

# int, uint, float
setting_type_kwargs -> ((setting_type_int_uint_float | setting_std_optional_kwarg) _):* (setting_type_int_uint_float | setting_std_optional_kwarg) {% d => FromMultiple(d[1], d[0], p => p[0]) %}
setting_type_int_uint_float -> "drag" | ("min" | "max") %op_assignment (%dqstring | %sqstring | %op_binary_sum:? const_number) {% MkSettingKwarg %}
# vec2,vec3,vec4
setting_type_kwargs -> ((setting_type_vec234 | setting_std_optional_kwargs) _):* (setting_type_vec234 | setting_std_optional_kwargs) {% d => FromMultiple(d[1], d[0], p => p[0]) %}
setting_type_vec234 -> "drag" {% MkSettingKwarg %}
# vec34
setting_type_kwargs -> ((setting_type_vec34 | setting_std_optional_kwargs) _):* (setting_type_vec34 | setting_std_optional_kwargs) {% d => FromMultiple(d[1], d[0], p => p[0]) %}
setting_type_vec34 -> "drag" | "color" {% MkSettingKwarg %}
# string
setting_type_kwargs -> ((setting_type_string | setting_std_optional_kwargs) _):* (setting_type_string | setting_std_optional_kwargs) {% d => FromMultiple(d[1], d[0], p => p[0]) %}
setting_type_string -> "multiline" | "password" | "max" %op_assignment (%dqstring | %sqstring | %op_binary_sum:? const_number) {% MkSettingKwarg %}

setting_tab_decl -> %lsqbracket _ "SettingsTab" _ settings_tab_kwargs:? _ %rsqbracket {%
    function(d) { return Compound(d, n.SettingsTabDeclaration, d[4]); }
%}

settings_tab_kwargs -> (settings_tab_kwarg _):* settings_tab_kwarg {%
    (d) => {
        let result = [d[1]];
        if (d[0])
        {
            for (let sub of d[0])
                result.push(sub[0]);
        }
        return Compound(d, n.SettingsTabKwarg, result);
    }
%}
settings_tab_kwarg -> ("icon" | "name") %op_assignment (%dqstring | %sqstring) {% MkSettingsTabKwarg %}

# floatNumber -> %number %dot %number "e" %op_unary:? %number
# floatNumber -> %number %dot %number
# floatNumber -> %number %dot
# floatNumber -> %dot %number
