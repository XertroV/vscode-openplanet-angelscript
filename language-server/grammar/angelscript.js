// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }


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
    op_binary_logic: ['&&', '||', 'or ', 'and ', 'xor ', '^^'],
    op_binary_sum: ['+', '-'],
    op_binary_product: ['*', '/', '%', '**'],
    // note: removed `>>` from op_binary_compare; causes bug with cast<array<X>>
    op_binary_compare: ["==", "!=", "<=", ">=", "is ", "!is "], // add spaces around `is` to avoid detecting `a isb` as `a is b`
    lt: "<",
    gt: ">",
    op_binary_bitwise: ["|", "&", "^"],
    op_assignment: "=",
    op_unary: ["!", "~", "not "],
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

settingArgNames = ["name", "category", "description", "min", "max", "hidden", "drag", "color", "multiline", "password", "icon"];

const tokenPartialSettingArg = {
    test: x => !settingArgNames.every(n => !n.substring(0, n.length - 1).startsWith(x))
};

function NodesAny(nodes, predicate) {
    for (let node of nodes) {
        if (predicate(node)) {
            return true;
        }
    }
    return false;
}

var grammar = {
    Lexer: lexer,
    ParserRules: [
    {"name": "optional_statement", "symbols": [], "postprocess": 
        function (d) { return null; }
        },
    {"name": "optional_statement", "symbols": ["_", "statement"], "postprocess": 
        function (d) { return d[1]; }
        },
    {"name": "optional_expression", "symbols": [], "postprocess": 
        function (d) { return null; }
        },
    {"name": "optional_expression", "symbols": ["_", "expression"], "postprocess": 
        function (d) { return d[1]; }
        },
    {"name": "statement", "symbols": ["expression"], "postprocess": id},
    {"name": "statement", "symbols": ["assignment"], "postprocess": id},
    {"name": "statement", "symbols": ["var_decl"], "postprocess": id},
    {"name": "assignment", "symbols": ["lvalue", "_", {"literal":"="}, "_", "expression_or_assignment"], "postprocess": 
        function (d) { return Compound(d, n.Assignment, [d[0], d[4]]); }
        },
    {"name": "assignment", "symbols": ["lvalue", "_", (lexer.has("compound_assignment") ? {type: "compound_assignment"} : compound_assignment), "_", "expression_or_assignment"], "postprocess": 
        function (d) { return {
            ...Compound(d, n.CompoundAssignment, [d[0], d[4]]),
            operator: Operator(d[2]),
        }; }
        },
    {"name": "expression_or_assignment", "symbols": ["expression"], "postprocess": id},
    {"name": "expression_or_assignment", "symbols": ["assignment"], "postprocess": id},
    {"name": "expression_or_assignment_or_var_decl", "symbols": ["expression_or_assignment"], "postprocess": id},
    {"name": "expression_or_assignment_or_var_decl", "symbols": ["var_decl"], "postprocess": id},
    {"name": "expression_or_assignment_or_var_decl", "symbols": ["statement"], "postprocess": id},
    {"name": "statement$ebnf$1$subexpression$1", "symbols": ["_", "expression_or_assignment"]},
    {"name": "statement$ebnf$1", "symbols": ["statement$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "statement$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "statement", "symbols": [(lexer.has("if_token") ? {type: "if_token"} : if_token), "_", (lexer.has("lparen") ? {type: "lparen"} : lparen), "statement$ebnf$1", "_", (lexer.has("rparen") ? {type: "rparen"} : rparen), "optional_statement"], "postprocess": 
        function (d)
        {
            if (d[3])
                return Compound(d, n.IfStatement, [d[3][1], d[6]]);
            else
                return Compound(d, n.IfStatement, [null, d[6]]);
        }
        },
    {"name": "statement", "symbols": [(lexer.has("return_token") ? {type: "return_token"} : return_token), "_", "expression_or_assignment"], "postprocess": 
        function (d) { return Compound(d, n.ReturnStatement, [d[2]]); }
        },
    {"name": "statement", "symbols": [(lexer.has("return_token") ? {type: "return_token"} : return_token)], "postprocess": 
        function (d) { return Compound(d, n.ReturnStatement, []); }
        },
    {"name": "statement", "symbols": [(lexer.has("else_token") ? {type: "else_token"} : else_token), "optional_statement"], "postprocess": 
        function (d) { return Compound(d, n.ElseStatement, [d[1]]); }
        },
    {"name": "statement$ebnf$2$subexpression$1", "symbols": [(lexer.has("const_token") ? {type: "const_token"} : const_token), "_"]},
    {"name": "statement$ebnf$2", "symbols": ["statement$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "statement$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "statement", "symbols": [(lexer.has("get_token") ? {type: "get_token"} : get_token), "_", "statement$ebnf$2"], "postprocess": d => Compound(d, n.GetStatement, [])},
    {"name": "statement", "symbols": [(lexer.has("set_token") ? {type: "set_token"} : set_token), "_"], "postprocess": d => Compound(d, n.SetStatement, [])},
    {"name": "statement", "symbols": [(lexer.has("try_token") ? {type: "try_token"} : try_token)], "postprocess": d => Compound(d, n.TryStatement, [])},
    {"name": "statement", "symbols": [(lexer.has("catch_token") ? {type: "catch_token"} : catch_token)], "postprocess": d => Compound(d, n.CatchStatement, [])},
    {"name": "statement", "symbols": [(lexer.has("switch_token") ? {type: "switch_token"} : switch_token), "_", (lexer.has("lparen") ? {type: "lparen"} : lparen), "optional_expression", "_", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": 
        function (d) { return Compound(d, n.SwitchStatement, [d[3]]); }
        },
    {"name": "statement", "symbols": [(lexer.has("case_token") ? {type: "case_token"} : case_token), "_", "case_label", "_", (lexer.has("colon") ? {type: "colon"} : colon), "optional_statement"], "postprocess": 
        function (d) { return {
                ...Compound(d, n.CaseStatement, [d[2], d[5]]),
                has_statement: true,
            }
        }
        },
    {"name": "statement", "symbols": [(lexer.has("case_token") ? {type: "case_token"} : case_token), "_", (lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": 
        function (d) { return Compound(d, n.CaseStatement, [Identifier(d[2]), null]); }
        },
    {"name": "statement", "symbols": [(lexer.has("case_token") ? {type: "case_token"} : case_token), "_", (lexer.has("identifier") ? {type: "identifier"} : identifier), "_", (lexer.has("colon") ? {type: "colon"} : colon)], "postprocess": 
        function (d) { return Compound(d, n.CaseStatement, [{
            ...Compound(d, n.NamespaceAccess, [Identifier(d[2]), null]),
            incomplete_colon: true,
        }, null]); }
        },
    {"name": "statement", "symbols": [(lexer.has("case_token") ? {type: "case_token"} : case_token), "_", (lexer.has("identifier") ? {type: "identifier"} : identifier), "_", (lexer.has("ns") ? {type: "ns"} : ns)], "postprocess": 
        function (d) { return Compound(d, n.CaseStatement, [{
            ...Compound(d, n.NamespaceAccess, [Identifier(d[2]), null]),
        }, null]); }
        },
    {"name": "statement", "symbols": [(lexer.has("case_token") ? {type: "case_token"} : case_token), "_", "case_label"], "postprocess": 
        function (d) { return Compound(d, n.CaseStatement, [d[2], null]); }
        },
    {"name": "statement", "symbols": [(lexer.has("default_token") ? {type: "default_token"} : default_token), (lexer.has("colon") ? {type: "colon"} : colon), "optional_statement"], "postprocess": 
        function (d) { return Compound(d, n.DefaultCaseStatement, [d[2]]); }
        },
    {"name": "statement", "symbols": [(lexer.has("continue_token") ? {type: "continue_token"} : continue_token)], "postprocess": 
        function (d) { return Literal(n.ContinueStatement, d[0]); }
        },
    {"name": "statement", "symbols": [(lexer.has("break_token") ? {type: "break_token"} : break_token)], "postprocess": 
        function (d) { return Literal(n.BreakStatement, d[0]); }
        },
    {"name": "statement$ebnf$3$subexpression$1", "symbols": ["_", "for_declaration"]},
    {"name": "statement$ebnf$3", "symbols": ["statement$ebnf$3$subexpression$1"], "postprocess": id},
    {"name": "statement$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "statement$ebnf$4$subexpression$1$ebnf$1$subexpression$1", "symbols": ["_", (lexer.has("semicolon") ? {type: "semicolon"} : semicolon), "for_comma_expression_list"]},
    {"name": "statement$ebnf$4$subexpression$1$ebnf$1", "symbols": ["statement$ebnf$4$subexpression$1$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "statement$ebnf$4$subexpression$1$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "statement$ebnf$4$subexpression$1", "symbols": ["_", (lexer.has("semicolon") ? {type: "semicolon"} : semicolon), "optional_expression", "statement$ebnf$4$subexpression$1$ebnf$1"]},
    {"name": "statement$ebnf$4", "symbols": ["statement$ebnf$4$subexpression$1"], "postprocess": id},
    {"name": "statement$ebnf$4", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "statement", "symbols": [(lexer.has("for_token") ? {type: "for_token"} : for_token), "_", (lexer.has("lparen") ? {type: "lparen"} : lparen), "statement$ebnf$3", "statement$ebnf$4", "_", (lexer.has("rparen") ? {type: "rparen"} : rparen), "optional_statement"], "postprocess": 
        function (d) {
            return Compound(d, n.ForLoop,
                [d[3] ? d[3][1] : null,
                d[4] ? d[4][2] : null,
                d[4] && d[4][3] ? d[4][3][2] : null,
                d[7]]);
        }
        },
    {"name": "for_declaration", "symbols": ["var_decl"], "postprocess": id},
    {"name": "for_declaration", "symbols": ["expression"], "postprocess": id},
    {"name": "for_declaration", "symbols": ["assignment"], "postprocess": id},
    {"name": "for_comma_expression_list", "symbols": [], "postprocess": 
        function (d) { return null; }
        },
    {"name": "for_comma_expression_list", "symbols": ["_", "for_comma_expression"], "postprocess": 
        function (d) { return d[1]; }
        },
    {"name": "for_comma_expression_list$ebnf$1$subexpression$1", "symbols": ["_", {"literal":","}, "_", "for_comma_expression"]},
    {"name": "for_comma_expression_list$ebnf$1", "symbols": ["for_comma_expression_list$ebnf$1$subexpression$1"]},
    {"name": "for_comma_expression_list$ebnf$1$subexpression$2", "symbols": ["_", {"literal":","}, "_", "for_comma_expression"]},
    {"name": "for_comma_expression_list$ebnf$1", "symbols": ["for_comma_expression_list$ebnf$1", "for_comma_expression_list$ebnf$1$subexpression$2"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "for_comma_expression_list", "symbols": ["_", "for_comma_expression", "for_comma_expression_list$ebnf$1"], "postprocess": 
        function (d) {
            exprs = [d[1]];
            for (let part of d[2])
                exprs.push(part[3]);
            return Compound(d, n.CommaExpression, exprs);
        }
        },
    {"name": "for_comma_expression", "symbols": ["expression"], "postprocess": id},
    {"name": "for_comma_expression", "symbols": ["assignment"], "postprocess": id},
    {"name": "statement", "symbols": [(lexer.has("while_token") ? {type: "while_token"} : while_token), "_", (lexer.has("lparen") ? {type: "lparen"} : lparen), "optional_expression", "_", (lexer.has("rparen") ? {type: "rparen"} : rparen), "optional_statement"], "postprocess": 
        function (d) { return Compound(d, n.WhileLoop, [d[3], d[6]]); }
        },
    {"name": "global_statement", "symbols": [(lexer.has("import_token") ? {type: "import_token"} : import_token)], "postprocess": 
        function (d) {
            return Compound(d, n.ImportStatement, [null]);
        }
        },
    {"name": "global_statement$ebnf$1", "symbols": []},
    {"name": "global_statement$ebnf$1$subexpression$1", "symbols": [(lexer.has("dot") ? {type: "dot"} : dot), (lexer.has("identifier") ? {type: "identifier"} : identifier)]},
    {"name": "global_statement$ebnf$1", "symbols": ["global_statement$ebnf$1", "global_statement$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "global_statement$ebnf$2", "symbols": [(lexer.has("dot") ? {type: "dot"} : dot)], "postprocess": id},
    {"name": "global_statement$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "global_statement", "symbols": [(lexer.has("import_token") ? {type: "import_token"} : import_token), "_", (lexer.has("identifier") ? {type: "identifier"} : identifier), "global_statement$ebnf$1", "global_statement$ebnf$2"], "postprocess": 
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
        },
    {"name": "global_statement$subexpression$1", "symbols": [(lexer.has("dqstring") ? {type: "dqstring"} : dqstring)]},
    {"name": "global_statement$subexpression$1", "symbols": [(lexer.has("sqstring") ? {type: "sqstring"} : sqstring)]},
    {"name": "global_statement", "symbols": [(lexer.has("import_token") ? {type: "import_token"} : import_token), "_", "function_decl", "_", {"literal":"from"}, "_", "global_statement$subexpression$1"], "postprocess": 
        function (d) {
            return Compound(d, n.ImportFunctionStatement, [d[2], IdentifierFromString(d[6][0])]);
        }
        },
    {"name": "global_declaration$ebnf$1$subexpression$1", "symbols": ["setting_tab_decl", "_"]},
    {"name": "global_declaration$ebnf$1", "symbols": ["global_declaration$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "global_declaration$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "global_declaration", "symbols": ["global_declaration$ebnf$1", "function_decl"], "postprocess": 
        function (d) { return {
            ...d[1], settingsTab: d[0] ? d[0][0] : null
        }; }
        },
    {"name": "global_declaration$ebnf$2$subexpression$1", "symbols": ["settings_decl", "_"]},
    {"name": "global_declaration$ebnf$2", "symbols": ["global_declaration$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "global_declaration$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "global_declaration", "symbols": ["global_declaration$ebnf$2", "var_decl"], "postprocess": 
        function (d) { /* console.log(d); */ return {
            ...d[1], setting: d[0] ? d[0][0] : null
        }; }
        },
    {"name": "global_declaration", "symbols": ["settings_decl", "_"], "postprocess": 
        function (d) { /* console.log(d); */ return {
            ...Compound(d, n.VariableDecl, null), setting: d[0]
        }; }
        },
    {"name": "global_declaration", "symbols": ["settings_decl"], "postprocess": 
        d => ({
            ...Compound(d, n.VariableDecl, null),
            setting: d[0],
        })
        },
    {"name": "global_declaration", "symbols": ["typename"], "postprocess": 
        function (d) { return {
            ...Compound(d, n.VariableDecl, null),
            name: null,
            typename: d[0],
        }; }
        },
    {"name": "class_decl_keyword$subexpression$1", "symbols": [(lexer.has("shared_token") ? {type: "shared_token"} : shared_token)]},
    {"name": "class_decl_keyword$subexpression$1", "symbols": [(lexer.has("mixin_token") ? {type: "mixin_token"} : mixin_token)]},
    {"name": "class_decl_keyword", "symbols": ["class_decl_keyword$subexpression$1", "_"], "postprocess": 
        function(d) {
            return d[0][0];
        }
        },
    {"name": "class_inherits_from$ebnf$1", "symbols": []},
    {"name": "class_inherits_from$ebnf$1$subexpression$1$ebnf$1", "symbols": ["typename_identifier"], "postprocess": id},
    {"name": "class_inherits_from$ebnf$1$subexpression$1$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "class_inherits_from$ebnf$1$subexpression$1", "symbols": ["_", (lexer.has("comma") ? {type: "comma"} : comma), "_", "class_inherits_from$ebnf$1$subexpression$1$ebnf$1"]},
    {"name": "class_inherits_from$ebnf$1", "symbols": ["class_inherits_from$ebnf$1", "class_inherits_from$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "class_inherits_from", "symbols": ["_", "typename_identifier", "class_inherits_from$ebnf$1"], "postprocess": 
        function(d) {
            let ids = [d[1]];
            if (d[2] && d[2].length > 0) {
                for (let inner of d[2]) {
                    if (inner[3]) {
                        ids.push(inner[3]);
                    }
                }
            }
            return ids;
        }
        },
    {"name": "global_declaration$ebnf$3", "symbols": []},
    {"name": "global_declaration$ebnf$3", "symbols": ["global_declaration$ebnf$3", "class_decl_keyword"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "global_declaration$subexpression$1", "symbols": [(lexer.has("class_token") ? {type: "class_token"} : class_token)]},
    {"name": "global_declaration$subexpression$1", "symbols": [(lexer.has("interface_token") ? {type: "interface_token"} : interface_token)]},
    {"name": "global_declaration$ebnf$4", "symbols": ["atref"], "postprocess": id},
    {"name": "global_declaration$ebnf$4", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "global_declaration$ebnf$5$subexpression$1", "symbols": ["_", (lexer.has("colon") ? {type: "colon"} : colon)]},
    {"name": "global_declaration$ebnf$5", "symbols": ["global_declaration$ebnf$5$subexpression$1"], "postprocess": id},
    {"name": "global_declaration$ebnf$5", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "global_declaration$ebnf$6", "symbols": ["class_inherits_from"], "postprocess": id},
    {"name": "global_declaration$ebnf$6", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "global_declaration", "symbols": ["global_declaration$ebnf$3", "global_declaration$subexpression$1", "_", "global_declaration$ebnf$4", (lexer.has("identifier") ? {type: "identifier"} : identifier), "global_declaration$ebnf$5", "global_declaration$ebnf$6"], "postprocess": 
        function (d) { return {
            ...Compound(d, n.ClassDefinition, null),
            name: Identifier(d[4]),
            // superclass: d[6] ? Identifier(d[6][1]) : null,
            superclass: d[6] ? d[6][0] : null,
            superclasses: d[6],
            is_interface: d[1][0].value == "interface",
            is_shared: (d[0]) ? NodesAny(d[0], n => n.value == "shared") : false,
            is_mixin: (d[0]) ? NodesAny(d[0], n => n.value == "mixin") : false
        }}
        },
    {"name": "global_declaration$ebnf$7$subexpression$1", "symbols": [(lexer.has("shared_token") ? {type: "shared_token"} : shared_token), "_"]},
    {"name": "global_declaration$ebnf$7", "symbols": ["global_declaration$ebnf$7$subexpression$1"], "postprocess": id},
    {"name": "global_declaration$ebnf$7", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "global_declaration", "symbols": ["global_declaration$ebnf$7", (lexer.has("enum_token") ? {type: "enum_token"} : enum_token), "_", (lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": 
        function (d) { return {
            ...Compound(d, n.EnumDefinition, null),
            name: Identifier(d[3]),
            is_shared: !!d[0],
        }}
        },
    {"name": "global_declaration$ebnf$8$subexpression$1", "symbols": [(lexer.has("shared_token") ? {type: "shared_token"} : shared_token), "_"]},
    {"name": "global_declaration$ebnf$8", "symbols": ["global_declaration$ebnf$8$subexpression$1"], "postprocess": id},
    {"name": "global_declaration$ebnf$8", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "global_declaration", "symbols": ["global_declaration$ebnf$8", (lexer.has("funcdef_token") ? {type: "funcdef_token"} : funcdef_token), "_", "function_signature"], "postprocess": 
        function (d) { return {
            ...Compound(d, n.FuncdefDefinition, [d[3]]),
            name: d[3].name,
            is_shared: !!d[0],
        }}
        },
    {"name": "namespace_definition_name$ebnf$1", "symbols": []},
    {"name": "namespace_definition_name$ebnf$1$subexpression$1", "symbols": ["_", (lexer.has("ns") ? {type: "ns"} : ns), "_", (lexer.has("identifier") ? {type: "identifier"} : identifier)]},
    {"name": "namespace_definition_name$ebnf$1", "symbols": ["namespace_definition_name$ebnf$1", "namespace_definition_name$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "namespace_definition_name", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier), "namespace_definition_name$ebnf$1"], "postprocess": 
        function (d) { return CompoundIdentifier(d, null); }
        },
    {"name": "global_declaration", "symbols": [(lexer.has("namespace_token") ? {type: "namespace_token"} : namespace_token), "_", "namespace_definition_name"], "postprocess": 
        function (d) { return {
            ...Compound(d, n.NamespaceDefinition, null),
            name: d[2],
        }; }
        },
    {"name": "class_declaration$ebnf$1$subexpression$1", "symbols": ["settings_decl", "_"]},
    {"name": "class_declaration$ebnf$1", "symbols": ["class_declaration$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "class_declaration$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "class_declaration$ebnf$2$subexpression$1", "symbols": ["access_specifier", "_"]},
    {"name": "class_declaration$ebnf$2", "symbols": ["class_declaration$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "class_declaration$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "class_declaration", "symbols": ["class_declaration$ebnf$1", "class_declaration$ebnf$2", "var_decl"], "postprocess": 
        function (d) {
            return ExtendedCompound(d, {
                ...d[2],
                access: d[1] ? d[1][0] : null,
                setting: d[0] ? d[0][0] : null,
            });
        }
        },
    {"name": "class_declaration$ebnf$3$subexpression$1", "symbols": ["access_specifier", "_"]},
    {"name": "class_declaration$ebnf$3", "symbols": ["class_declaration$ebnf$3$subexpression$1"], "postprocess": id},
    {"name": "class_declaration$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "class_declaration", "symbols": ["class_declaration$ebnf$3", "typename"], "postprocess": 
        function (d) {
            return ExtendedCompound(d, {
                ...Compound(d, n.VariableDecl, null),
                name: null,
                typename: d[1],
                access: d[0] ? d[0][0] : null,
            });
        }
        },
    {"name": "class_declaration$ebnf$4$subexpression$1", "symbols": ["access_specifier", "_"]},
    {"name": "class_declaration$ebnf$4", "symbols": ["class_declaration$ebnf$4$subexpression$1"], "postprocess": id},
    {"name": "class_declaration$ebnf$4", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "class_declaration", "symbols": ["class_declaration$ebnf$4", "function_signature"], "postprocess": 
        function (d) {
            return ExtendedCompound(d, {
                ...d[1],
                access: d[0] ? d[0][0] : null,
            });
        }
        },
    {"name": "class_declaration", "symbols": ["access_specifier", "_", "function_signature"], "postprocess": 
        function (d) {
            return ExtendedCompound(d, {
                ...d[2],
                access: d[0],
            });
        }
        },
    {"name": "class_declaration", "symbols": ["constructor_decl"], "postprocess": id},
    {"name": "class_declaration", "symbols": ["destructor_decl"], "postprocess": id},
    {"name": "class_statement", "symbols": [(lexer.has("default_token") ? {type: "default_token"} : default_token), "_", "expression"], "postprocess": 
        function (d) { return Compound(d, n.DefaultStatement, [d[2]]); }
        },
    {"name": "class_statement", "symbols": [(lexer.has("default_token") ? {type: "default_token"} : default_token), "_", "assignment"], "postprocess": 
        function (d) { return Compound(d, n.DefaultStatement, [d[2]]); }
        },
    {"name": "class_statement", "symbols": ["access_declaration"], "postprocess": 
        function (d) { return d[0]; }
        },
    {"name": "access_declaration", "symbols": [(lexer.has("access_token") ? {type: "access_token"} : access_token), "_", (lexer.has("identifier") ? {type: "identifier"} : identifier), "_", (lexer.has("op_assignment") ? {type: "op_assignment"} : op_assignment), "_", "access_list"], "postprocess": 
        function (d) {
            return {
                ...Compound( d, n.AccessDeclaration, null),
                name: Identifier(d[2]),
                classList: d[6],
            };
        }
        },
    {"name": "access_declaration$ebnf$1$subexpression$1", "symbols": ["_", (lexer.has("op_assignment") ? {type: "op_assignment"} : op_assignment)]},
    {"name": "access_declaration$ebnf$1", "symbols": ["access_declaration$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "access_declaration$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "access_declaration", "symbols": [(lexer.has("access_token") ? {type: "access_token"} : access_token), "_", (lexer.has("identifier") ? {type: "identifier"} : identifier), "access_declaration$ebnf$1"], "postprocess": 
        function (d) {
            return {
                ...Compound( d, n.AccessDeclaration, null),
                name: Identifier(d[2]),
                classList: [],
            };
        }
        },
    {"name": "access_list", "symbols": [], "postprocess": 
        function(d) { return []; }
        },
    {"name": "access_list$ebnf$1", "symbols": []},
    {"name": "access_list$ebnf$1$subexpression$1", "symbols": ["_", {"literal":","}, "_", "access_class"]},
    {"name": "access_list$ebnf$1", "symbols": ["access_list$ebnf$1", "access_list$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "access_list$ebnf$2$subexpression$1", "symbols": ["_", (lexer.has("comma") ? {type: "comma"} : comma)]},
    {"name": "access_list$ebnf$2", "symbols": ["access_list$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "access_list$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "access_list", "symbols": ["access_class", "access_list$ebnf$1", "access_list$ebnf$2"], "postprocess": 
        function(d) {
            let args = [d[0]];
            if (d[1])
            {
                for (let part of d[1])
                    args.push(part[3]);
            }
            return args;
        }
        },
    {"name": "access_class$subexpression$1", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)]},
    {"name": "access_class$subexpression$1", "symbols": [{"literal":"*"}]},
    {"name": "access_class$ebnf$1$subexpression$1", "symbols": ["_", (lexer.has("lparen") ? {type: "lparen"} : lparen), "_", "access_mod_list", "_", (lexer.has("rparen") ? {type: "rparen"} : rparen)]},
    {"name": "access_class$ebnf$1", "symbols": ["access_class$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "access_class$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "access_class", "symbols": ["access_class$subexpression$1", "access_class$ebnf$1"], "postprocess": 
        function (d) {
            return {
                ...Compound( d, n.AccessClass, null),
                className: Identifier(d[0][0]),
                mods: d[1] ? d[1][3] : null,
            };
        }
        },
    {"name": "access_mod_list", "symbols": [], "postprocess": 
        function(d) { return []; }
        },
    {"name": "access_mod_list$ebnf$1", "symbols": []},
    {"name": "access_mod_list$ebnf$1$subexpression$1", "symbols": ["_", {"literal":","}, "_", (lexer.has("identifier") ? {type: "identifier"} : identifier)]},
    {"name": "access_mod_list$ebnf$1", "symbols": ["access_mod_list$ebnf$1", "access_mod_list$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "access_mod_list$ebnf$2$subexpression$1", "symbols": ["_", (lexer.has("comma") ? {type: "comma"} : comma)]},
    {"name": "access_mod_list$ebnf$2", "symbols": ["access_mod_list$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "access_mod_list$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "access_mod_list", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier), "access_mod_list$ebnf$1", "access_mod_list$ebnf$2"], "postprocess": 
        function(d) {
            let args = [d[0]];
            if (d[1])
            {
                for (let part of d[1])
                    args.push(Identifier(part[3]));
            }
            return args;
        }
        },
    {"name": "mb_ref_identifier$ebnf$1", "symbols": ["atref"], "postprocess": id},
    {"name": "mb_ref_identifier$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "mb_ref_identifier", "symbols": ["mb_ref_identifier$ebnf$1", (lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": 
        function (d) { return {
            ...ExtendedCompound(d, Identifier(d[1])),
            is_reference: !!d[0],
        }; }
        },
    {"name": "var_decl", "symbols": ["typename", "_", "mb_ref_identifier"], "postprocess": 
        function (d) { return {
            ...Compound(d, n.VariableDecl, null),
            name: d[2],
            typename: d[0],
        }; }
        },
    {"name": "var_decl$ebnf$1$subexpression$1", "symbols": ["_", "expression"]},
    {"name": "var_decl$ebnf$1", "symbols": ["var_decl$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "var_decl$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "var_decl", "symbols": ["typename", "_", "mb_ref_identifier", "_", {"literal":"="}, "var_decl$ebnf$1"], "postprocess": 
        function (d) { return {
            ...Compound(d, n.VariableDecl, null),
            name: d[2],
            typename: d[0],
            expression: d[5] ? d[5][1] : null,
            inline_assignment: d[5] ? true : false,
        }; }
        },
    {"name": "var_decl", "symbols": ["typename", "_", (lexer.has("identifier") ? {type: "identifier"} : identifier), "_", (lexer.has("lparen") ? {type: "lparen"} : lparen), "argumentlist", "_", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": 
        function (d) { return {
            ...Compound(d, n.VariableDecl, null),
            name: Identifier(d[2]),
            typename: d[0],
            expression: d[5],
            inline_constructor: true,
        }; }
        },
    {"name": "var_decl$ebnf$2$subexpression$1", "symbols": ["_", (lexer.has("comma") ? {type: "comma"} : comma), "_", "var_decl_multi_part"]},
    {"name": "var_decl$ebnf$2", "symbols": ["var_decl$ebnf$2$subexpression$1"]},
    {"name": "var_decl$ebnf$2$subexpression$2", "symbols": ["_", (lexer.has("comma") ? {type: "comma"} : comma), "_", "var_decl_multi_part"]},
    {"name": "var_decl$ebnf$2", "symbols": ["var_decl$ebnf$2", "var_decl$ebnf$2$subexpression$2"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "var_decl", "symbols": ["typename", "_", "var_decl_multi_part", "var_decl$ebnf$2"], "postprocess": 
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
        },
    {"name": "var_decl_multi_part$ebnf$1$subexpression$1", "symbols": ["_", {"literal":"="}, "_", "expression"]},
    {"name": "var_decl_multi_part$ebnf$1", "symbols": ["var_decl_multi_part$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "var_decl_multi_part$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "var_decl_multi_part", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier), "var_decl_multi_part$ebnf$1"], "postprocess": 
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
        },
    {"name": "function_decl$ebnf$1$subexpression$1", "symbols": [(lexer.has("shared_token") ? {type: "shared_token"} : shared_token), "_"]},
    {"name": "function_decl$ebnf$1", "symbols": ["function_decl$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "function_decl$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "function_decl", "symbols": ["function_decl$ebnf$1", "function_signature"], "postprocess": function(d) { return d[1]; }},
    {"name": "constructor_decl", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier), "_", (lexer.has("lparen") ? {type: "lparen"} : lparen), "_", "parameter_list", "_", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": 
        function (d) { return {
            ...Compound(d, n.ConstructorDecl, null),
            name: Identifier(d[0]),
            parameters: d[4],
        }; }
        },
    {"name": "destructor_decl", "symbols": [{"literal":"~"}, (lexer.has("identifier") ? {type: "identifier"} : identifier), "_", (lexer.has("lparen") ? {type: "lparen"} : lparen), "_", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": 
        function (d) { return {
            ...Compound(d, n.DestructorDecl, null),
            name: CompoundIdentifier([d[0], d[1]]),
        }; }
        },
    {"name": "function_signature", "symbols": ["function_return", "_", (lexer.has("identifier") ? {type: "identifier"} : identifier), "_", (lexer.has("lparen") ? {type: "lparen"} : lparen), "_", "parameter_list", "_", (lexer.has("rparen") ? {type: "rparen"} : rparen), "func_qualifiers"], "postprocess": 
        function (d) { return {
            ...Compound(d, n.FunctionDecl, null),
            name: Identifier(d[2]),
            returntype: d[0],
            parameters: d[6],
            qualifiers: d[9],
        }; }
        },
    {"name": "function_signature", "symbols": [(lexer.has("void_token") ? {type: "void_token"} : void_token), "_", (lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": 
        function (d) { return {
            ...Compound(d, n.FunctionDecl, null),
            name: Identifier(d[2]),
            returntype: d[0],
            parameters: [],
            qualifiers: [],
        }; }
        },
    {"name": "function_return", "symbols": ["typename"], "postprocess": id},
    {"name": "function_return", "symbols": [(lexer.has("void_token") ? {type: "void_token"} : void_token)], "postprocess": 
        function (d) { return null; }
        },
    {"name": "parameter_list", "symbols": [], "postprocess": 
        function(d) { return []; }
        },
    {"name": "parameter_list$ebnf$1$subexpression$1", "symbols": [(lexer.has("comma") ? {type: "comma"} : comma), "_"]},
    {"name": "parameter_list$ebnf$1", "symbols": ["parameter_list$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "parameter_list$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "parameter_list$ebnf$2", "symbols": []},
    {"name": "parameter_list$ebnf$2$subexpression$1", "symbols": ["_", (lexer.has("comma") ? {type: "comma"} : comma), "_", "parameter"]},
    {"name": "parameter_list$ebnf$2", "symbols": ["parameter_list$ebnf$2", "parameter_list$ebnf$2$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "parameter_list$ebnf$3$subexpression$1", "symbols": ["_", (lexer.has("comma") ? {type: "comma"} : comma)]},
    {"name": "parameter_list$ebnf$3", "symbols": ["parameter_list$ebnf$3$subexpression$1"], "postprocess": id},
    {"name": "parameter_list$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "parameter_list", "symbols": ["parameter_list$ebnf$1", "parameter", "parameter_list$ebnf$2", "parameter_list$ebnf$3"], "postprocess": 
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
        },
    {"name": "parameter", "symbols": [(lexer.has("const_token") ? {type: "const_token"} : const_token)], "postprocess": 
        function (d) { return null; }
        },
    {"name": "parameter", "symbols": ["typename"], "postprocess": 
        function (d) { return {
            ...Compound(d, n.Parameter, null),
            typename: d[0],
        }; }
        },
    {"name": "parameter", "symbols": ["typename", "_", (lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": 
        function (d) { return {
            ...Compound(d, n.Parameter, null),
            typename: d[0],
            name: Identifier(d[2]),
        }; }
        },
    {"name": "parameter", "symbols": ["typename", "_", (lexer.has("identifier") ? {type: "identifier"} : identifier), "_", {"literal":"="}, "optional_expression"], "postprocess": 
        function (d) { return {
            ...Compound(d, n.Parameter, null),
            typename: d[0],
            name: Identifier(d[2]),
            expression: d[5],
        }; }
        },
    {"name": "macro_list", "symbols": [], "postprocess": 
        function(d) { return []; }
        },
    {"name": "macro_list$ebnf$1", "symbols": []},
    {"name": "macro_list$ebnf$1$subexpression$1", "symbols": ["_", {"literal":","}, "_", "macro_argument"]},
    {"name": "macro_list$ebnf$1", "symbols": ["macro_list$ebnf$1", "macro_list$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "macro_list$ebnf$2$subexpression$1", "symbols": ["_", (lexer.has("comma") ? {type: "comma"} : comma)]},
    {"name": "macro_list$ebnf$2", "symbols": ["macro_list$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "macro_list$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "macro_list", "symbols": ["macro_argument", "macro_list$ebnf$1", "macro_list$ebnf$2"], "postprocess": 
        function(d) {
            let args = [d[0]];
            if (d[1])
            {
                for (let part of d[1])
                    args.push(part[3]);
            }
            return args;
        }
        },
    {"name": "macro_argument", "symbols": ["macro_identifier"], "postprocess": 
        function (d) { return {
            ...Compound(d, n.MacroArgument, null),
            name: d[0],
        }; }
        },
    {"name": "macro_argument", "symbols": ["macro_identifier", "_", {"literal":"="}, "_", "macro_value"], "postprocess": 
        function (d) { return {
            ...Compound(d, n.MacroArgument, null),
            name: d[0],
            value: d[4],
        }; }
        },
    {"name": "macro_argument", "symbols": ["macro_identifier", "_", {"literal":"="}, "_", (lexer.has("lparen") ? {type: "lparen"} : lparen), "_", "macro_list", "_", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": 
        function (d) { return {
            ...Compound(d, n.MacroArgument, d[6]),
            name: d[0],
        }; }
        },
    {"name": "macro_identifier", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": 
        function (d) { return Identifier(d[0]); }
        },
    {"name": "macro_identifier", "symbols": [(lexer.has("dqstring") ? {type: "dqstring"} : dqstring)], "postprocess": 
        function (d) { return IdentifierFromString(d[0]); }
        },
    {"name": "macro_identifier", "symbols": [(lexer.has("sqstring") ? {type: "sqstring"} : sqstring)], "postprocess": 
        function (d) { return IdentifierFromString(d[0]); }
        },
    {"name": "macro_value", "symbols": ["macro_identifier"], "postprocess": id},
    {"name": "macro_value$ebnf$1$subexpression$1", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier), "_", {"literal":"|"}, "_"]},
    {"name": "macro_value$ebnf$1", "symbols": ["macro_value$ebnf$1$subexpression$1"]},
    {"name": "macro_value$ebnf$1$subexpression$2", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier), "_", {"literal":"|"}, "_"]},
    {"name": "macro_value$ebnf$1", "symbols": ["macro_value$ebnf$1", "macro_value$ebnf$1$subexpression$2"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "macro_value", "symbols": ["macro_value$ebnf$1", (lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": 
        function (d) {
            return CompoundIdentifier(d, null);
        }
        },
    {"name": "macro_value$ebnf$2$subexpression$1", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier), "_", (lexer.has("ns") ? {type: "ns"} : ns), "_"]},
    {"name": "macro_value$ebnf$2", "symbols": ["macro_value$ebnf$2$subexpression$1"]},
    {"name": "macro_value$ebnf$2$subexpression$2", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier), "_", (lexer.has("ns") ? {type: "ns"} : ns), "_"]},
    {"name": "macro_value$ebnf$2", "symbols": ["macro_value$ebnf$2", "macro_value$ebnf$2$subexpression$2"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "macro_value", "symbols": ["macro_value$ebnf$2", (lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": 
        function (d) {
            return CompoundIdentifier(d, null);
        }
        },
    {"name": "macro_value$ebnf$3$subexpression$1", "symbols": [{"literal":"-"}, "_"]},
    {"name": "macro_value$ebnf$3", "symbols": ["macro_value$ebnf$3$subexpression$1"], "postprocess": id},
    {"name": "macro_value$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "macro_value", "symbols": ["macro_value$ebnf$3", (lexer.has("bool_token") ? {type: "bool_token"} : bool_token)], "postprocess": 
        function (d) {
            return Identifier(d[1]);
        }
        },
    {"name": "macro_value$ebnf$4$subexpression$1", "symbols": [{"literal":"-"}, "_"]},
    {"name": "macro_value$ebnf$4", "symbols": ["macro_value$ebnf$4$subexpression$1"], "postprocess": id},
    {"name": "macro_value$ebnf$4", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "macro_value", "symbols": ["macro_value$ebnf$4", "const_number"], "postprocess": 
        function (d) {
            if (!d[0])
                return d[1];
            return CompoundLiteral(
                d[1].type,
                d,
                null
            );
        }
        },
    {"name": "expression", "symbols": ["expr_ternary"], "postprocess": id},
    {"name": "expression", "symbols": ["expr_array"], "postprocess": id},
    {"name": "expression", "symbols": ["expr_inline_function"], "postprocess": id},
    {"name": "expr_array$ebnf$1$subexpression$1", "symbols": ["typename", "_", {"literal":"="}, "_"]},
    {"name": "expr_array$ebnf$1", "symbols": ["expr_array$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "expr_array$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "expr_array", "symbols": ["expr_array$ebnf$1", (lexer.has("lbrace") ? {type: "lbrace"} : lbrace), "_", "array_expr_list", "_", (lexer.has("rbrace") ? {type: "rbrace"} : rbrace)], "postprocess": 
        function(d) { return Compound(d, n.ArrayInline, d[3] ? [d[3]] : []); }
        },
    {"name": "expr_ternary", "symbols": ["expr_binary_logic", "_", (lexer.has("ternary") ? {type: "ternary"} : ternary), "_", "expr_ternary", "_", (lexer.has("colon") ? {type: "colon"} : colon), "_", "expr_ternary"], "postprocess": 
        function (d) { return Compound(d, n.TernaryOperation, [d[0], d[4], d[8]]); }
        },
    {"name": "expr_ternary", "symbols": ["expr_binary_logic"], "postprocess": id},
    {"name": "expr_binary_logic$ebnf$1$subexpression$1", "symbols": ["_", "expr_binary_bitwise"]},
    {"name": "expr_binary_logic$ebnf$1", "symbols": ["expr_binary_logic$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "expr_binary_logic$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "expr_binary_logic", "symbols": ["expr_binary_logic", "_", (lexer.has("op_binary_logic") ? {type: "op_binary_logic"} : op_binary_logic), "expr_binary_logic$ebnf$1"], "postprocess": 
        function (d) { return {
            ...Compound(d, n.BinaryOperation, [d[0], d[3] ? d[3][1] : null]),
            operator: Operator(d[2]),
        };}
        },
    {"name": "expr_binary_logic", "symbols": ["expr_binary_ushr"], "postprocess": id},
    {"name": "expr_binary_ushr$subexpression$1", "symbols": [(lexer.has("gt") ? {type: "gt"} : gt), (lexer.has("gt") ? {type: "gt"} : gt), (lexer.has("gt") ? {type: "gt"} : gt)]},
    {"name": "expr_binary_ushr$subexpression$2", "symbols": ["_", "expr_binary_bitwise"]},
    {"name": "expr_binary_ushr", "symbols": ["expr_binary_ushr", "_", "expr_binary_ushr$subexpression$1", "expr_binary_ushr$subexpression$2"], "postprocess": 
        function (d) { return {
            ...Compound(d, n.BinaryOperation, [d[0], d[3] ? d[3][1] : null]),
            operator: Operator(CompoundLiteral('', d[2])),
        };}
        },
    {"name": "expr_binary_ushr", "symbols": ["expr_binary_bitwise"], "postprocess": id},
    {"name": "op_binary_bitwise$subexpression$1", "symbols": [(lexer.has("op_binary_bitwise") ? {type: "op_binary_bitwise"} : op_binary_bitwise)]},
    {"name": "op_binary_bitwise$subexpression$1", "symbols": [(lexer.has("gt") ? {type: "gt"} : gt), (lexer.has("gt") ? {type: "gt"} : gt)]},
    {"name": "op_binary_bitwise$subexpression$1", "symbols": [(lexer.has("lt") ? {type: "lt"} : lt), (lexer.has("lt") ? {type: "lt"} : lt)]},
    {"name": "op_binary_bitwise", "symbols": ["op_binary_bitwise$subexpression$1"], "postprocess": 
        function(d) {
            return CompoundLiteral('', d);
        }
        },
    {"name": "expr_binary_bitwise$ebnf$1$subexpression$1", "symbols": ["_", "expr_binary_compare"]},
    {"name": "expr_binary_bitwise$ebnf$1", "symbols": ["expr_binary_bitwise$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "expr_binary_bitwise$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "expr_binary_bitwise", "symbols": ["expr_binary_bitwise", "_", "op_binary_bitwise", "expr_binary_bitwise$ebnf$1"], "postprocess": 
        function (d) { return {
            ...Compound(d, n.BinaryOperation, [d[0], d[3] ? d[3][1] : null]),
            operator: Operator(d[2]),
        };}
        },
    {"name": "expr_binary_bitwise", "symbols": ["expr_binary_compare"], "postprocess": id},
    {"name": "op_binary_compare$subexpression$1", "symbols": [(lexer.has("op_binary_compare") ? {type: "op_binary_compare"} : op_binary_compare)]},
    {"name": "op_binary_compare$subexpression$1", "symbols": [{"literal":"<"}]},
    {"name": "op_binary_compare$subexpression$1", "symbols": [{"literal":">"}]},
    {"name": "op_binary_compare", "symbols": ["op_binary_compare$subexpression$1"], "postprocess": function (d) { return d[0][0]; }},
    {"name": "expr_binary_compare$ebnf$1$subexpression$1", "symbols": ["_", "expr_binary_sum"]},
    {"name": "expr_binary_compare$ebnf$1", "symbols": ["expr_binary_compare$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "expr_binary_compare$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "expr_binary_compare", "symbols": ["expr_binary_compare", "_", "op_binary_compare", "expr_binary_compare$ebnf$1"], "postprocess": 
        function (d) { return {
            ...Compound(d, n.BinaryOperation, [d[0], d[3] ? d[3][1] : null]),
            operator: Operator(d[2]),
        };}
        },
    {"name": "expr_binary_compare", "symbols": ["expr_binary_sum"], "postprocess": id},
    {"name": "expr_binary_sum$ebnf$1$subexpression$1", "symbols": ["_", "expr_binary_product"]},
    {"name": "expr_binary_sum$ebnf$1", "symbols": ["expr_binary_sum$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "expr_binary_sum$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "expr_binary_sum", "symbols": ["expr_binary_sum", "_", (lexer.has("op_binary_sum") ? {type: "op_binary_sum"} : op_binary_sum), "expr_binary_sum$ebnf$1"], "postprocess": 
        function (d) { return {
            ...Compound(d, n.BinaryOperation, [d[0], d[3] ? d[3][1] : null]),
            operator: Operator(d[2]),
        };}
        },
    {"name": "expr_binary_sum", "symbols": ["expr_binary_product"], "postprocess": id},
    {"name": "expr_binary_product$ebnf$1$subexpression$1", "symbols": ["_", "expr_unary"]},
    {"name": "expr_binary_product$ebnf$1", "symbols": ["expr_binary_product$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "expr_binary_product$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "expr_binary_product", "symbols": ["expr_binary_product", "_", (lexer.has("op_binary_product") ? {type: "op_binary_product"} : op_binary_product), "expr_binary_product$ebnf$1"], "postprocess": 
        function (d) { return {
            ...Compound(d, n.BinaryOperation, [d[0], d[3] ? d[3][1] : null]),
            operator: Operator(d[2]),
        };}
        },
    {"name": "expr_binary_product", "symbols": ["expr_unary"], "postprocess": id},
    {"name": "expr_unary", "symbols": ["unary_operator", "_", "expr_unary"], "postprocess": 
        function (d) { return {
            ...Compound(d, n.UnaryOperation, [d[2]]),
            operator: Operator(d[0]),
        };}
        },
    {"name": "expr_unary", "symbols": ["expr_postfix"], "postprocess": id},
    {"name": "expr_postfix", "symbols": ["expr_postfix", "_", (lexer.has("postfix_operator") ? {type: "postfix_operator"} : postfix_operator)], "postprocess": 
        function (d) { return {
            ...Compound(d, n.PostfixOperation, [d[0]]),
            operator: Operator(d[2]),
        };}
        },
    {"name": "expr_postfix$ebnf$1", "symbols": [{"literal":"!"}], "postprocess": id},
    {"name": "expr_postfix$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "expr_postfix", "symbols": ["expr_leaf", "expr_postfix$ebnf$1"], "postprocess": 
        function (d) { return d[0]; }
        },
    {"name": "expr_leaf", "symbols": ["lvalue"], "postprocess": id},
    {"name": "expr_leaf", "symbols": ["constant"], "postprocess": id},
    {"name": "expr_leaf", "symbols": ["unary_operator"], "postprocess": 
        function (d) { return {
            ...Compound(d, n.UnaryOperation, []),
            operator: Operator(d[0]),
        };}
        },
    {"name": "lvalue", "symbols": ["lvalue_inner"], "postprocess": id},
    {"name": "lvalue", "symbols": ["atref", "lvalue_inner"], "postprocess": 
        function(d) {
            return ExtendedCompound(d, {...d[1], is_reference: true});
        }
        },
    {"name": "lvalue_inner", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": 
        function(d, l) { return Identifier(d[0]); }
        },
    {"name": "lvalue_inner", "symbols": [(lexer.has("this_token") ? {type: "this_token"} : this_token)], "postprocess": 
        function (d) { return Literal(n.This, d[0]); }
        },
    {"name": "lvalue_inner", "symbols": ["lvalue_inner", "_", (lexer.has("dot") ? {type: "dot"} : dot), "_", (lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": 
        function (d) { return Compound(d, n.MemberAccess, [d[0], Identifier(d[4])]); }
        },
    {"name": "lvalue_inner", "symbols": [(lexer.has("lparen") ? {type: "lparen"} : lparen), "_", "expression", "_", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": 
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
        },
    {"name": "lvalue_inner", "symbols": ["lvalue_inner", "_", (lexer.has("lparen") ? {type: "lparen"} : lparen), "argumentlist", "_", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": 
        function (d) { return Compound(d, n.FunctionCall, [d[0], d[3]]); }
        },
    {"name": "lvalue_inner", "symbols": ["lvalue_inner", "_", (lexer.has("lsqbracket") ? {type: "lsqbracket"} : lsqbracket), "optional_expression", "_", (lexer.has("rsqbracket") ? {type: "rsqbracket"} : rsqbracket)], "postprocess": 
        function (d) { return Compound(d, n.IndexOperator, [d[0], d[3]]); }
        },
    {"name": "lvalue_inner", "symbols": ["template_typename", "_", (lexer.has("lparen") ? {type: "lparen"} : lparen), "argumentlist", "_", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": 
        function (d) { return Compound(d, n.ConstructorCall, [d[0], d[3]]); }
        },
    {"name": "lvalue_inner", "symbols": [(lexer.has("cast_token") ? {type: "cast_token"} : cast_token), "_", {"literal":"<"}, "_", "typename", "_", {"literal":">"}, "_", (lexer.has("lparen") ? {type: "lparen"} : lparen), "optional_expression", "_", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": 
        function (d) { return Compound(d, n.CastOperation, [d[4], d[9]]); }
        },
    {"name": "expression$ebnf$1$subexpression$1", "symbols": ["_", {"literal":"<"}]},
    {"name": "expression$ebnf$1", "symbols": ["expression$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "expression$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "expression", "symbols": [(lexer.has("cast_token") ? {type: "cast_token"} : cast_token), "expression$ebnf$1"], "postprocess": 
        function (d) { return Compound(d, n.CastOperation, [null, null]); }
        },
    {"name": "expression$ebnf$2$subexpression$1", "symbols": ["_", {"literal":">"}]},
    {"name": "expression$ebnf$2", "symbols": ["expression$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "expression$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "expression", "symbols": [(lexer.has("cast_token") ? {type: "cast_token"} : cast_token), "_", {"literal":"<"}, "_", "typename", "expression$ebnf$2"], "postprocess": 
        function (d) { return Compound(d, n.CastOperation, [d[4], null]); }
        },
    {"name": "lvalue_inner", "symbols": ["namespace_access"], "postprocess": id},
    {"name": "namespace_access", "symbols": ["namespace_access", "_", (lexer.has("ns") ? {type: "ns"} : ns), "_", (lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": 
        function (d) { return Compound(d, n.NamespaceAccess, [d[0], Identifier(d[4])]); }
        },
    {"name": "namespace_access", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier), "_", (lexer.has("ns") ? {type: "ns"} : ns), "_", (lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": 
        function (d) { return Compound(d, n.NamespaceAccess, [Identifier(d[0]), Identifier(d[4])]); }
        },
    {"name": "namespace_access", "symbols": [(lexer.has("ns") ? {type: "ns"} : ns), "_", (lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": 
        function (d) { return Compound(d, n.NamespaceAccess, [null, Identifier(d[2])]); }
        },
    {"name": "lvalue_inner", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier), "_", (lexer.has("ns") ? {type: "ns"} : ns)], "postprocess": 
        function (d) { return Compound(d, n.NamespaceAccess, [Identifier(d[0]), null]); }
        },
    {"name": "lvalue_inner", "symbols": ["namespace_access", "_", (lexer.has("ns") ? {type: "ns"} : ns)], "postprocess": 
        function (d) { return Compound(d, n.NamespaceAccess, [d[0], null]); }
        },
    {"name": "lvalue_inner", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier), "_", {"literal":":"}], "postprocess": 
        function (d) { return {
            ...Compound(d, n.NamespaceAccess, [Identifier(d[0]), null]),
            incomplete_colon: true
         } }
        },
    {"name": "lvalue_inner", "symbols": ["namespace_access", "_", {"literal":":"}], "postprocess": 
        function (d) { return {
            ...Compound(d, n.NamespaceAccess, [d[0], null]),
            incomplete_colon: true
         } }
        },
    {"name": "lvalue_inner", "symbols": ["lvalue_inner", "_", (lexer.has("dot") ? {type: "dot"} : dot)], "postprocess": 
        function (d) { return Compound(d, n.MemberAccess, [d[0], null]); }
        },
    {"name": "lvalue_inner", "symbols": [(lexer.has("lparen") ? {type: "lparen"} : lparen), "_", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": 
        function (d) { return null; }
        },
    {"name": "assignment", "symbols": ["lvalue", "_", {"literal":"="}], "postprocess": 
        function (d) { return Compound(d, n.Assignment, [d[0], null]); }
        },
    {"name": "assignment", "symbols": ["lvalue", "_", (lexer.has("compound_assignment") ? {type: "compound_assignment"} : compound_assignment)], "postprocess": 
        function (d) { return {
            ...Compound(d, n.CompoundAssignment, [d[0], null]),
            operator: Operator(d[2]),
        }; }
        },
    {"name": "argumentlist", "symbols": [], "postprocess": 
        function(d) { return null; }
        },
    {"name": "argumentlist", "symbols": ["_", (lexer.has("comma") ? {type: "comma"} : comma)], "postprocess": 
        function(d) { return null; }
        },
    {"name": "argumentlist$ebnf$1", "symbols": []},
    {"name": "argumentlist$ebnf$1$subexpression$1", "symbols": [(lexer.has("comma") ? {type: "comma"} : comma), "_"]},
    {"name": "argumentlist$ebnf$1", "symbols": ["argumentlist$ebnf$1", "argumentlist$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "argumentlist$ebnf$2", "symbols": []},
    {"name": "argumentlist$ebnf$2$subexpression$1$ebnf$1$subexpression$1", "symbols": [(lexer.has("comma") ? {type: "comma"} : comma), "_"]},
    {"name": "argumentlist$ebnf$2$subexpression$1$ebnf$1", "symbols": ["argumentlist$ebnf$2$subexpression$1$ebnf$1$subexpression$1"]},
    {"name": "argumentlist$ebnf$2$subexpression$1$ebnf$1$subexpression$2", "symbols": [(lexer.has("comma") ? {type: "comma"} : comma), "_"]},
    {"name": "argumentlist$ebnf$2$subexpression$1$ebnf$1", "symbols": ["argumentlist$ebnf$2$subexpression$1$ebnf$1", "argumentlist$ebnf$2$subexpression$1$ebnf$1$subexpression$2"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "argumentlist$ebnf$2$subexpression$1", "symbols": ["argument", "_", "argumentlist$ebnf$2$subexpression$1$ebnf$1"]},
    {"name": "argumentlist$ebnf$2", "symbols": ["argumentlist$ebnf$2", "argumentlist$ebnf$2$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "argumentlist$ebnf$3", "symbols": []},
    {"name": "argumentlist$ebnf$3$subexpression$1", "symbols": ["_", (lexer.has("comma") ? {type: "comma"} : comma)]},
    {"name": "argumentlist$ebnf$3", "symbols": ["argumentlist$ebnf$3", "argumentlist$ebnf$3$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "argumentlist", "symbols": ["_", "argumentlist$ebnf$1", "argumentlist$ebnf$2", "argument", "argumentlist$ebnf$3"], "postprocess": 
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
        },
    {"name": "argument", "symbols": ["expression"], "postprocess": id},
    {"name": "argument", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier), "_", {"literal":"="}, "optional_expression"], "postprocess": 
        function (d) { return Compound(d, n.NamedArgument, [Identifier(d[0]), d[3]]); }
        },
    {"name": "argument", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier), (lexer.has("WS") ? {type: "WS"} : WS), "expr_leaf"], "postprocess": 
        function (d) { return Compound(d, n.NamedArgument, [Identifier(d[0]), d[2]]); }
        },
    {"name": "expr_inline_function", "symbols": [(lexer.has("function_token") ? {type: "function_token"} : function_token), "_", (lexer.has("lparen") ? {type: "lparen"} : lparen), "_", "parameter_list", "_", (lexer.has("rparen") ? {type: "rparen"} : rparen), "a_complete_scope"], "postprocess": 
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
        },
    {"name": "expr_inline_function", "symbols": [(lexer.has("function_token") ? {type: "function_token"} : function_token), "_", (lexer.has("lparen") ? {type: "lparen"} : lparen), "_", "parameter_list", "_", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": 
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
        },
    {"name": "a_complete_scope", "symbols": ["_", (lexer.has("lbrace") ? {type: "lbrace"} : lbrace), "_", (lexer.has("rbrace") ? {type: "rbrace"} : rbrace)], "postprocess": d => { return []; }},
    {"name": "a_complete_scope$ebnf$1", "symbols": [(lexer.has("semicolon") ? {type: "semicolon"} : semicolon)], "postprocess": id},
    {"name": "a_complete_scope$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "a_complete_scope$ebnf$2", "symbols": []},
    {"name": "a_complete_scope$ebnf$2$subexpression$1", "symbols": ["_", (lexer.has("semicolon") ? {type: "semicolon"} : semicolon), "_", "expression_or_assignment_or_var_decl"]},
    {"name": "a_complete_scope$ebnf$2", "symbols": ["a_complete_scope$ebnf$2", "a_complete_scope$ebnf$2$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "a_complete_scope$ebnf$3", "symbols": [(lexer.has("semicolon") ? {type: "semicolon"} : semicolon)], "postprocess": id},
    {"name": "a_complete_scope$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "a_complete_scope", "symbols": ["_", (lexer.has("lbrace") ? {type: "lbrace"} : lbrace), "_", "a_complete_scope$ebnf$1", "_", "expression_or_assignment_or_var_decl", "a_complete_scope$ebnf$2", "_", "a_complete_scope$ebnf$3", "_", (lexer.has("rbrace") ? {type: "rbrace"} : rbrace)], "postprocess": 
        d => { return []; }
        },
    {"name": "const_number", "symbols": [(lexer.has("number") ? {type: "number"} : number)], "postprocess": 
        function(d) { return Literal(n.ConstInteger, d[0]); }
        },
    {"name": "const_number", "symbols": [(lexer.has("hex_number") ? {type: "hex_number"} : hex_number)], "postprocess": 
        function(d) { return Literal(n.ConstHexInteger, d[0]); }
        },
    {"name": "const_number", "symbols": [(lexer.has("binary_number") ? {type: "binary_number"} : binary_number)], "postprocess": 
        function(d) { return Literal(n.ConstBinaryInteger, d[0]); }
        },
    {"name": "const_number", "symbols": [(lexer.has("octal_number") ? {type: "octal_number"} : octal_number)], "postprocess": 
        function(d) { return Literal(n.ConstOctalInteger, d[0]); }
        },
    {"name": "const_number", "symbols": [(lexer.has("number") ? {type: "number"} : number), {"literal":"."}, (lexer.has("number") ? {type: "number"} : number), {"literal":"e"}, {"literal":"-"}, (lexer.has("number") ? {type: "number"} : number)], "postprocess": 
        function(d) { return CompoundLiteral(n.ConstFloat, d, null); }
        },
    {"name": "const_number", "symbols": [(lexer.has("number") ? {type: "number"} : number), {"literal":"."}, (lexer.has("number") ? {type: "number"} : number), {"literal":"e"}, (lexer.has("number") ? {type: "number"} : number)], "postprocess": 
        function(d) { return CompoundLiteral(n.ConstFloat, d, null); }
        },
    {"name": "const_number", "symbols": [(lexer.has("number") ? {type: "number"} : number), {"literal":"."}, (lexer.has("number") ? {type: "number"} : number), {"literal":"f"}], "postprocess": 
        function(d) { return CompoundLiteral(n.ConstFloat, d, null); }
        },
    {"name": "const_number", "symbols": [{"literal":"."}, (lexer.has("number") ? {type: "number"} : number), {"literal":"f"}], "postprocess": 
        function(d) { return CompoundLiteral(n.ConstFloat, d, null); }
        },
    {"name": "const_number", "symbols": [(lexer.has("number") ? {type: "number"} : number), {"literal":"."}, {"literal":"f"}], "postprocess": 
        function(d) { return CompoundLiteral(n.ConstFloat, d, null); }
        },
    {"name": "const_number", "symbols": [(lexer.has("number") ? {type: "number"} : number), {"literal":"."}, (lexer.has("number") ? {type: "number"} : number)], "postprocess": 
        function(d) { return CompoundLiteral(n.ConstDouble, d, null); }
        },
    {"name": "const_number", "symbols": [{"literal":"."}, (lexer.has("number") ? {type: "number"} : number)], "postprocess": 
        function(d) { return CompoundLiteral(n.ConstDouble, d, null); }
        },
    {"name": "const_number", "symbols": [(lexer.has("number") ? {type: "number"} : number), {"literal":"."}], "postprocess": 
        function(d) { return CompoundLiteral(n.ConstDouble, d, null); }
        },
    {"name": "constant", "symbols": [(lexer.has("dqstring") ? {type: "dqstring"} : dqstring)], "postprocess": 
        function(d) { return Literal(n.ConstString, d[0]); }
        },
    {"name": "constant$ebnf$1", "symbols": []},
    {"name": "constant$ebnf$1$subexpression$1", "symbols": ["_", (lexer.has("dqstring") ? {type: "dqstring"} : dqstring)]},
    {"name": "constant$ebnf$1", "symbols": ["constant$ebnf$1", "constant$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "constant", "symbols": [(lexer.has("dqstring") ? {type: "dqstring"} : dqstring), "constant$ebnf$1"], "postprocess": 
        function(d) { return Literal(n.ConstString, d[0]); } // todo, extend
        },
    {"name": "constant", "symbols": [(lexer.has("dqstring") ? {type: "dqstring"} : dqstring), "_", (lexer.has("lsqbracket") ? {type: "lsqbracket"} : lsqbracket), "_", (lexer.has("number") ? {type: "number"} : number), "_", (lexer.has("rsqbracket") ? {type: "rsqbracket"} : rsqbracket)], "postprocess": 
        function(d) { return Literal(n.ConstInteger, d[0]); } // `"test"[2]` -> returns uint8
        },
    {"name": "constant", "symbols": [(lexer.has("trpstring") ? {type: "trpstring"} : trpstring)], "postprocess": 
        function(d) { return Literal(n.ConstString, d[0]); }
        },
    {"name": "constant", "symbols": [(lexer.has("sqstring") ? {type: "sqstring"} : sqstring)], "postprocess": 
        function(d) { return Literal(n.ConstString, d[0]); }
        },
    {"name": "constant", "symbols": [{"literal":"n"}, (lexer.has("dqstring") ? {type: "dqstring"} : dqstring)], "postprocess": 
        function(d) { return CompoundLiteral(n.ConstName, d, null); }
        },
    {"name": "constant", "symbols": [{"literal":"f"}, (lexer.has("dqstring") ? {type: "dqstring"} : dqstring)], "postprocess": 
        function(d) { return CompoundLiteral(n.ConstFormatString, d, null); }
        },
    {"name": "constant", "symbols": ["const_number"], "postprocess": id},
    {"name": "constant", "symbols": [(lexer.has("bool_token") ? {type: "bool_token"} : bool_token)], "postprocess": 
        function (d) { return Literal(n.ConstBool, d[0]); }
        },
    {"name": "constant", "symbols": [(lexer.has("nullptr_token") ? {type: "nullptr_token"} : nullptr_token)], "postprocess": 
        function (d) { return Literal(n.ConstNullptr, d[0]); }
        },
    {"name": "unary_operator", "symbols": [(lexer.has("op_binary_sum") ? {type: "op_binary_sum"} : op_binary_sum)], "postprocess": id},
    {"name": "unary_operator", "symbols": [(lexer.has("op_unary") ? {type: "op_unary"} : op_unary)], "postprocess": id},
    {"name": "unary_operator", "symbols": [(lexer.has("postfix_operator") ? {type: "postfix_operator"} : postfix_operator)], "postprocess": id},
    {"name": "atref", "symbols": ["_", (lexer.has("atsign") ? {type: "atsign"} : atsign)], "postprocess": 
        (d) => { return ExtendedCompound(d, Identifier(d[1])); }
        },
    {"name": "typename$ebnf$1", "symbols": ["const_qualifier"], "postprocess": id},
    {"name": "typename$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "typename$ebnf$2", "symbols": ["atref"], "postprocess": id},
    {"name": "typename$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "typename$ebnf$3", "symbols": ["ref_qualifiers"], "postprocess": id},
    {"name": "typename$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "typename", "symbols": ["typename$ebnf$1", "unqualified_typename", "typename$ebnf$2", "typename$ebnf$3"], "postprocess": 
        function (d) { return ExtendedCompound(d, {
            ...d[1],
            const_qualifier: d[0],
            ref_qualifier: d[3],
            is_reference: d[2],
        });}
        },
    {"name": "non_const_typename$ebnf$1", "symbols": ["atref"], "postprocess": id},
    {"name": "non_const_typename$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "non_const_typename$ebnf$2", "symbols": ["ref_qualifiers"], "postprocess": id},
    {"name": "non_const_typename$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "non_const_typename", "symbols": ["unqualified_typename", "non_const_typename$ebnf$1", "non_const_typename$ebnf$2"], "postprocess": 
        function (d) { return ExtendedCompound(d, {
            ...d[0],
            const_qualifier: null,
            ref_qualifier: d[2],
            is_reference: d[1],
        });}
        },
    {"name": "unqualified_typename", "symbols": ["typename_identifier"], "postprocess": 
        function (d) { return {
            ...Compound(d, n.Typename, null),
            value: d[0].value,
            name: d[0],
        }}
        },
    {"name": "unqualified_typename", "symbols": ["template_typename"], "postprocess": id},
    {"name": "template_typename", "symbols": ["typename_identifier", "_", {"literal":"<"}, "_", {"literal":">"}], "postprocess": 
        function (d) {
            let typename = d[0].value+"<>";
            return {
                ...Compound(d, n.Typename, null),
                value: typename,
                basetype: d[0],
                subtypes: [],
            };
        }
        },
    {"name": "template_typename", "symbols": ["template_subtype_single", "_", (lexer.has("lsqbracket") ? {type: "lsqbracket"} : lsqbracket), "_", (lexer.has("rsqbracket") ? {type: "rsqbracket"} : rsqbracket)], "postprocess": 
        function (d) {
            let typename = "array<" + d[0][0].value + ">";
            return {
                ...Compound(d, n.Typename, null),
                value: typename,
                basetype: 'array',
                subtypes: d[0]
            }
        }
        },
    {"name": "template_typename", "symbols": ["typename_identifier", "_", {"literal":"<"}, "_", "template_subtypes", "_", {"literal":">"}], "postprocess": 
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
        },
    {"name": "template_typename$subexpression$1", "symbols": [(lexer.has("gt") ? {type: "gt"} : gt), (lexer.has("gt") ? {type: "gt"} : gt)]},
    {"name": "template_typename", "symbols": ["typename_identifier", "_", {"literal":"<"}, "_", "template_subtypes_unterminated", "_", "template_typename$subexpression$1"], "postprocess": 
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
        },
    {"name": "typename_unterminated$ebnf$1", "symbols": ["const_qualifier"], "postprocess": id},
    {"name": "typename_unterminated$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "typename_unterminated", "symbols": ["typename_unterminated$ebnf$1", "typename_identifier", "_", {"literal":"<"}, "_", "template_subtypes", "_"], "postprocess": 
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
        },
    {"name": "template_subtype_single", "symbols": ["non_const_typename"], "postprocess": 
        function (d) {
            return [d[0]];
        }
        },
    {"name": "template_subtypes$ebnf$1", "symbols": []},
    {"name": "template_subtypes$ebnf$1$subexpression$1", "symbols": ["_", {"literal":","}, "_", "typename"]},
    {"name": "template_subtypes$ebnf$1", "symbols": ["template_subtypes$ebnf$1", "template_subtypes$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "template_subtypes", "symbols": ["typename", "template_subtypes$ebnf$1"], "postprocess": 
        function (d) {
            let subtypes = [d[0]];
            if (d[1])
            {
                for (let part of d[1])
                    subtypes.push(part[3]);
            }
            return subtypes;
        }
        },
    {"name": "template_subtypes_unterminated$ebnf$1", "symbols": []},
    {"name": "template_subtypes_unterminated$ebnf$1$subexpression$1", "symbols": ["typename", "_", {"literal":","}, "_"]},
    {"name": "template_subtypes_unterminated$ebnf$1", "symbols": ["template_subtypes_unterminated$ebnf$1", "template_subtypes_unterminated$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "template_subtypes_unterminated", "symbols": ["template_subtypes_unterminated$ebnf$1", "typename_unterminated"], "postprocess": 
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
        },
    {"name": "typename_identifier", "symbols": [(lexer.has("template_basetype") ? {type: "template_basetype"} : template_basetype)], "postprocess": 
        function (d) { return Literal(n.Typename, d[0]); }
        },
    {"name": "typename_identifier$ebnf$1$subexpression$1", "symbols": [(lexer.has("ns") ? {type: "ns"} : ns), "_"]},
    {"name": "typename_identifier$ebnf$1", "symbols": ["typename_identifier$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "typename_identifier$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "typename_identifier$ebnf$2", "symbols": []},
    {"name": "typename_identifier$ebnf$2$subexpression$1", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier), "_", (lexer.has("ns") ? {type: "ns"} : ns), "_"]},
    {"name": "typename_identifier$ebnf$2", "symbols": ["typename_identifier$ebnf$2", "typename_identifier$ebnf$2$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "typename_identifier$ebnf$3", "symbols": ["atref"], "postprocess": id},
    {"name": "typename_identifier$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "typename_identifier", "symbols": ["typename_identifier$ebnf$1", "typename_identifier$ebnf$2", (lexer.has("identifier") ? {type: "identifier"} : identifier), "typename_identifier$ebnf$3"], "postprocess": 
        function (d) { return {...CompoundLiteral(n.Typename, d.slice(0, 3), null), is_reference: d[3]}; }
        },
    {"name": "const_qualifier", "symbols": [(lexer.has("const_token") ? {type: "const_token"} : const_token), "_"], "postprocess": 
        function (d) { return Identifier(d[0]); }
        },
    {"name": "ref_qualifiers$ebnf$1$subexpression$1$subexpression$1", "symbols": [{"literal":"in"}]},
    {"name": "ref_qualifiers$ebnf$1$subexpression$1$subexpression$1", "symbols": [{"literal":"out"}]},
    {"name": "ref_qualifiers$ebnf$1$subexpression$1$subexpression$1", "symbols": [{"literal":"inout"}]},
    {"name": "ref_qualifiers$ebnf$1$subexpression$1", "symbols": ["_", "ref_qualifiers$ebnf$1$subexpression$1$subexpression$1"]},
    {"name": "ref_qualifiers$ebnf$1", "symbols": ["ref_qualifiers$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "ref_qualifiers$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "ref_qualifiers", "symbols": ["_", {"literal":"&"}, "ref_qualifiers$ebnf$1"], "postprocess": 
        function (d) { return d[2] ? d[1].value+d[2][1][0].value : d[1].value; }
        },
    {"name": "func_qualifiers", "symbols": [], "postprocess": 
        function(d) { return null; }
        },
    {"name": "func_qualifiers$ebnf$1", "symbols": []},
    {"name": "func_qualifiers$ebnf$1$subexpression$1", "symbols": ["func_qualifier", "__"]},
    {"name": "func_qualifiers$ebnf$1", "symbols": ["func_qualifiers$ebnf$1", "func_qualifiers$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "func_qualifiers", "symbols": ["_", "func_qualifiers$ebnf$1", "func_qualifier"], "postprocess": 
        function(d) {
            let quals = [d[2].value];
            if (d[1])
            {
                for (let part of d[1])
                    quals.push(part[0].value);
            }
            return quals;
        }
        },
    {"name": "func_qualifier$subexpression$1", "symbols": [(lexer.has("const_token") ? {type: "const_token"} : const_token)]},
    {"name": "func_qualifier$subexpression$1", "symbols": [(lexer.has("final_token") ? {type: "final_token"} : final_token)]},
    {"name": "func_qualifier$subexpression$1", "symbols": [(lexer.has("override_token") ? {type: "override_token"} : override_token)]},
    {"name": "func_qualifier$subexpression$1", "symbols": [(lexer.has("property_token") ? {type: "property_token"} : property_token)]},
    {"name": "func_qualifier", "symbols": ["func_qualifier$subexpression$1"], "postprocess": 
        function (d) { return d[0][0]; }
        },
    {"name": "func_qualifier", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": 
        function (d) { return d[0].value; }
        },
    {"name": "access_specifier$subexpression$1", "symbols": [{"literal":"private"}]},
    {"name": "access_specifier$subexpression$1", "symbols": [{"literal":"protected"}]},
    {"name": "access_specifier$subexpression$1", "symbols": [{"literal":"public"}]},
    {"name": "access_specifier", "symbols": ["access_specifier$subexpression$1"], "postprocess": 
        function (d) { return Identifier(d[0][0]); }
        },
    {"name": "access_specifier$ebnf$1$subexpression$1", "symbols": ["_", (lexer.has("colon") ? {type: "colon"} : colon), "_", (lexer.has("identifier") ? {type: "identifier"} : identifier)]},
    {"name": "access_specifier$ebnf$1", "symbols": ["access_specifier$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "access_specifier$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "access_specifier", "symbols": [(lexer.has("access_token") ? {type: "access_token"} : access_token), "access_specifier$ebnf$1"], "postprocess": 
        function (d)
        {
            if (d[1])
                return Identifier(d[1][3]);
            return null;
        }
        },
    {"name": "class_statement$ebnf$1$subexpression$1", "symbols": ["_", (lexer.has("identifier") ? {type: "identifier"} : identifier)]},
    {"name": "class_statement$ebnf$1", "symbols": ["class_statement$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "class_statement$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "class_statement", "symbols": [(lexer.has("access_token") ? {type: "access_token"} : access_token), "_", (lexer.has("colon") ? {type: "colon"} : colon), "class_statement$ebnf$1"], "postprocess": 
        function (d) { return Compound(
            d, n.IncompleteAccessSpecifier, [
                d[3] ? Identifier(d[3][1]) : null
            ]
        ); }
        },
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1$subexpression$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)]},
    {"name": "_$ebnf$1$subexpression$1", "symbols": [(lexer.has("line_comment") ? {type: "line_comment"} : line_comment)]},
    {"name": "_$ebnf$1$subexpression$1", "symbols": [(lexer.has("block_comment") ? {type: "block_comment"} : block_comment)]},
    {"name": "_$ebnf$1$subexpression$1", "symbols": [(lexer.has("preprocessor_statement") ? {type: "preprocessor_statement"} : preprocessor_statement)]},
    {"name": "_$ebnf$1", "symbols": ["_$ebnf$1", "_$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "_", "symbols": ["_$ebnf$1"], "postprocess": 
        function (d) { return null; }
        },
    {"name": "__", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": 
        function (d) { return null; }
        },
    {"name": "__", "symbols": ["_", (lexer.has("block_comment") ? {type: "block_comment"} : block_comment), "_"], "postprocess": 
        function (d) { return null; }
        },
    {"name": "__", "symbols": ["_", (lexer.has("line_comment") ? {type: "line_comment"} : line_comment), "_"], "postprocess": 
        function (d) { return null; }
        },
    {"name": "__", "symbols": ["_", (lexer.has("prepocessor_statement") ? {type: "prepocessor_statement"} : prepocessor_statement), "_"], "postprocess": 
        function (d) { return null; }
        },
    {"name": "case_label", "symbols": [(lexer.has("lparen") ? {type: "lparen"} : lparen), "_", "case_label", "_", (lexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": 
        function (d) { return d[2]; }
        },
    {"name": "case_label$ebnf$1$subexpression$1", "symbols": [{"literal":"-"}, "_"]},
    {"name": "case_label$ebnf$1", "symbols": ["case_label$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "case_label$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "case_label", "symbols": ["case_label$ebnf$1", (lexer.has("number") ? {type: "number"} : number)], "postprocess": 
        function (d) {
            return CompoundLiteral(
                n.ConstInteger,
                d,
                null
            );
        }
        },
    {"name": "case_label", "symbols": ["namespace_access"], "postprocess": id},
    {"name": "array_statement$ebnf$1", "symbols": []},
    {"name": "array_statement$ebnf$1$subexpression$1", "symbols": ["_", (lexer.has("comma") ? {type: "comma"} : comma), "_", "expression"]},
    {"name": "array_statement$ebnf$1", "symbols": ["array_statement$ebnf$1", "array_statement$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "array_statement", "symbols": ["expression", "array_statement$ebnf$1"], "postprocess": 
        function (d) {
            let result = [d[0]];
            if (d[1]) {
                for (let sub of d[1]) {
                    result.push(sub[3]);
                }
            }
            return Compound(d, n.ArrayValueList, result);
        }
        },
    {"name": "array_expr_list", "symbols": [], "postprocess": 
        function(d) { return null; }
        },
    {"name": "array_expr_list", "symbols": ["_", (lexer.has("comma") ? {type: "comma"} : comma)], "postprocess": 
        function(d) { return null; }
        },
    {"name": "array_expr_list", "symbols": ["array_statement"], "postprocess": id},
    {"name": "enum_statement$ebnf$1", "symbols": []},
    {"name": "enum_statement$ebnf$1$subexpression$1", "symbols": ["_", (lexer.has("comma") ? {type: "comma"} : comma), "enum_decl"]},
    {"name": "enum_statement$ebnf$1", "symbols": ["enum_statement$ebnf$1", "enum_statement$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "enum_statement$ebnf$2$subexpression$1", "symbols": ["_", (lexer.has("comma") ? {type: "comma"} : comma)]},
    {"name": "enum_statement$ebnf$2", "symbols": ["enum_statement$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "enum_statement$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "enum_statement", "symbols": ["enum_decl", "enum_statement$ebnf$1", "enum_statement$ebnf$2"], "postprocess": 
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
        },
    {"name": "enum_decl$ebnf$1", "symbols": ["comment_documentation"], "postprocess": id},
    {"name": "enum_decl$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "enum_decl", "symbols": ["enum_decl$ebnf$1", (lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": 
         function (d) { return {
             ...Compound(d, n.EnumValue, null),
             name: Identifier(d[1]),
             documentation: d[0],
        }; }
        },
    {"name": "enum_decl$ebnf$2", "symbols": ["comment_documentation"], "postprocess": id},
    {"name": "enum_decl$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "enum_decl", "symbols": ["enum_decl$ebnf$2", (lexer.has("identifier") ? {type: "identifier"} : identifier), "_", {"literal":"="}, "_", "expression"], "postprocess": 
         function (d) { return {
             ...Compound(d, n.EnumValue, null),
             name: Identifier(d[1]),
             value: d[5],
             documentation: d[0],
        }; }
        },
    {"name": "comment_documentation$ebnf$1", "symbols": []},
    {"name": "comment_documentation$ebnf$1", "symbols": ["comment_documentation$ebnf$1", (lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "comment_documentation$ebnf$2", "symbols": []},
    {"name": "comment_documentation$ebnf$2$subexpression$1$ebnf$1", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "comment_documentation$ebnf$2$subexpression$1$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "comment_documentation$ebnf$2$subexpression$1", "symbols": [(lexer.has("block_comment") ? {type: "block_comment"} : block_comment), "comment_documentation$ebnf$2$subexpression$1$ebnf$1"]},
    {"name": "comment_documentation$ebnf$2$subexpression$1$ebnf$2", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "comment_documentation$ebnf$2$subexpression$1$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "comment_documentation$ebnf$2$subexpression$1", "symbols": [(lexer.has("line_comment") ? {type: "line_comment"} : line_comment), "comment_documentation$ebnf$2$subexpression$1$ebnf$2"]},
    {"name": "comment_documentation$ebnf$2$subexpression$1$ebnf$3", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": id},
    {"name": "comment_documentation$ebnf$2$subexpression$1$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "comment_documentation$ebnf$2$subexpression$1", "symbols": [(lexer.has("preprocessor_statement") ? {type: "preprocessor_statement"} : preprocessor_statement), "comment_documentation$ebnf$2$subexpression$1$ebnf$3"]},
    {"name": "comment_documentation$ebnf$2", "symbols": ["comment_documentation$ebnf$2", "comment_documentation$ebnf$2$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "comment_documentation", "symbols": ["comment_documentation$ebnf$1", "comment_documentation$ebnf$2"], "postprocess": 
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
        },
    {"name": "statement$ebnf$5$subexpression$1", "symbols": ["_", {"literal":">"}]},
    {"name": "statement$ebnf$5", "symbols": ["statement$ebnf$5$subexpression$1"], "postprocess": id},
    {"name": "statement$ebnf$5", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "statement", "symbols": ["scuffed_template_statement", "statement$ebnf$5"], "postprocess": id},
    {"name": "class_statement", "symbols": ["scuffed_template_statement"], "postprocess": id},
    {"name": "global_statement", "symbols": ["scuffed_template_statement"], "postprocess": id},
    {"name": "scuffed_template_statement$ebnf$1$subexpression$1", "symbols": ["_", {"literal":"<"}]},
    {"name": "scuffed_template_statement$ebnf$1", "symbols": ["scuffed_template_statement$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "scuffed_template_statement$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "scuffed_template_statement", "symbols": [(lexer.has("template_basetype") ? {type: "template_basetype"} : template_basetype), "scuffed_template_statement$ebnf$1"], "postprocess": 
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
        },
    {"name": "scuffed_template_statement", "symbols": [(lexer.has("template_basetype") ? {type: "template_basetype"} : template_basetype), "_", {"literal":"<"}, "_", "typename"], "postprocess": 
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
        },
    {"name": "settings_decl", "symbols": ["_", "setting_var_decl"], "postprocess": d => d[1]},
    {"name": "setting_var_decl$ebnf$1", "symbols": [(lexer.has("rsqbracket") ? {type: "rsqbracket"} : rsqbracket)], "postprocess": id},
    {"name": "setting_var_decl$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "setting_var_decl", "symbols": [(lexer.has("lsqbracket") ? {type: "lsqbracket"} : lsqbracket), {"literal":"Setting"}, "_", "setting_var_decl$ebnf$1"], "postprocess": function(d) { return Compound(d, n.SettingDeclaration, []); }},
    {"name": "setting_var_decl", "symbols": [(lexer.has("lsqbracket") ? {type: "lsqbracket"} : lsqbracket), {"literal":"Setting"}, "_", "setting_type_kwargs", "_", (lexer.has("rsqbracket") ? {type: "rsqbracket"} : rsqbracket)], "postprocess": function(d) { return Compound(d, n.SettingDeclaration, [d[3], d[5]]); }},
    {"name": "setting_std_optional_kwarg", "symbols": [{"literal":"hidden"}]},
    {"name": "setting_std_optional_kwarg$subexpression$1", "symbols": [{"literal":"name"}]},
    {"name": "setting_std_optional_kwarg$subexpression$1", "symbols": [{"literal":"category"}]},
    {"name": "setting_std_optional_kwarg$subexpression$1", "symbols": [{"literal":"description"}]},
    {"name": "setting_std_optional_kwarg$subexpression$2", "symbols": [(lexer.has("dqstring") ? {type: "dqstring"} : dqstring)]},
    {"name": "setting_std_optional_kwarg$subexpression$2", "symbols": [(lexer.has("sqstring") ? {type: "sqstring"} : sqstring)]},
    {"name": "setting_std_optional_kwarg", "symbols": ["setting_std_optional_kwarg$subexpression$1", (lexer.has("op_assignment") ? {type: "op_assignment"} : op_assignment), "setting_std_optional_kwarg$subexpression$2"], "postprocess": MkSettingKwarg},
    {"name": "setting_std_optional_kwarg", "symbols": [(lexer.has("tokenPartialSettingArg") ? {type: "tokenPartialSettingArg"} : tokenPartialSettingArg)], "postprocess": MkSettingKwarg},
    {"name": "setting_std_optional_kwargs$ebnf$1", "symbols": []},
    {"name": "setting_std_optional_kwargs$ebnf$1$subexpression$1", "symbols": ["setting_std_optional_kwarg", "_"]},
    {"name": "setting_std_optional_kwargs$ebnf$1", "symbols": ["setting_std_optional_kwargs$ebnf$1", "setting_std_optional_kwargs$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "setting_std_optional_kwargs", "symbols": ["setting_std_optional_kwargs$ebnf$1", "setting_std_optional_kwarg"], "postprocess": 
        (d) => {
            let result = [d[1]];
            if (d[0])
            {
                for (let sub of d[0])
                    result.push(sub[0]);
            }
            return Compound(d, n.SettingKwarg, result);
        }
        },
    {"name": "setting_type_kwargs$ebnf$1", "symbols": []},
    {"name": "setting_type_kwargs$ebnf$1$subexpression$1$subexpression$1", "symbols": ["setting_type_int_uint_float"]},
    {"name": "setting_type_kwargs$ebnf$1$subexpression$1$subexpression$1", "symbols": ["setting_std_optional_kwarg"]},
    {"name": "setting_type_kwargs$ebnf$1$subexpression$1", "symbols": ["setting_type_kwargs$ebnf$1$subexpression$1$subexpression$1", "_"]},
    {"name": "setting_type_kwargs$ebnf$1", "symbols": ["setting_type_kwargs$ebnf$1", "setting_type_kwargs$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "setting_type_kwargs$subexpression$1", "symbols": ["setting_type_int_uint_float"]},
    {"name": "setting_type_kwargs$subexpression$1", "symbols": ["setting_std_optional_kwarg"]},
    {"name": "setting_type_kwargs", "symbols": ["setting_type_kwargs$ebnf$1", "setting_type_kwargs$subexpression$1"], "postprocess": d => FromMultiple(d[1], d[0], p => p[0])},
    {"name": "setting_type_int_uint_float", "symbols": [{"literal":"drag"}]},
    {"name": "setting_type_int_uint_float$subexpression$1", "symbols": [{"literal":"min"}]},
    {"name": "setting_type_int_uint_float$subexpression$1", "symbols": [{"literal":"max"}]},
    {"name": "setting_type_int_uint_float$subexpression$2", "symbols": [(lexer.has("dqstring") ? {type: "dqstring"} : dqstring)]},
    {"name": "setting_type_int_uint_float$subexpression$2", "symbols": [(lexer.has("sqstring") ? {type: "sqstring"} : sqstring)]},
    {"name": "setting_type_int_uint_float$subexpression$2$ebnf$1", "symbols": [(lexer.has("op_binary_sum") ? {type: "op_binary_sum"} : op_binary_sum)], "postprocess": id},
    {"name": "setting_type_int_uint_float$subexpression$2$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "setting_type_int_uint_float$subexpression$2", "symbols": ["setting_type_int_uint_float$subexpression$2$ebnf$1", "const_number"]},
    {"name": "setting_type_int_uint_float", "symbols": ["setting_type_int_uint_float$subexpression$1", (lexer.has("op_assignment") ? {type: "op_assignment"} : op_assignment), "setting_type_int_uint_float$subexpression$2"], "postprocess": MkSettingKwarg},
    {"name": "setting_type_kwargs$ebnf$2", "symbols": []},
    {"name": "setting_type_kwargs$ebnf$2$subexpression$1$subexpression$1", "symbols": ["setting_type_vec234"]},
    {"name": "setting_type_kwargs$ebnf$2$subexpression$1$subexpression$1", "symbols": ["setting_std_optional_kwargs"]},
    {"name": "setting_type_kwargs$ebnf$2$subexpression$1", "symbols": ["setting_type_kwargs$ebnf$2$subexpression$1$subexpression$1", "_"]},
    {"name": "setting_type_kwargs$ebnf$2", "symbols": ["setting_type_kwargs$ebnf$2", "setting_type_kwargs$ebnf$2$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "setting_type_kwargs$subexpression$2", "symbols": ["setting_type_vec234"]},
    {"name": "setting_type_kwargs$subexpression$2", "symbols": ["setting_std_optional_kwargs"]},
    {"name": "setting_type_kwargs", "symbols": ["setting_type_kwargs$ebnf$2", "setting_type_kwargs$subexpression$2"], "postprocess": d => FromMultiple(d[1], d[0], p => p[0])},
    {"name": "setting_type_vec234", "symbols": [{"literal":"drag"}], "postprocess": MkSettingKwarg},
    {"name": "setting_type_kwargs$ebnf$3", "symbols": []},
    {"name": "setting_type_kwargs$ebnf$3$subexpression$1$subexpression$1", "symbols": ["setting_type_vec34"]},
    {"name": "setting_type_kwargs$ebnf$3$subexpression$1$subexpression$1", "symbols": ["setting_std_optional_kwargs"]},
    {"name": "setting_type_kwargs$ebnf$3$subexpression$1", "symbols": ["setting_type_kwargs$ebnf$3$subexpression$1$subexpression$1", "_"]},
    {"name": "setting_type_kwargs$ebnf$3", "symbols": ["setting_type_kwargs$ebnf$3", "setting_type_kwargs$ebnf$3$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "setting_type_kwargs$subexpression$3", "symbols": ["setting_type_vec34"]},
    {"name": "setting_type_kwargs$subexpression$3", "symbols": ["setting_std_optional_kwargs"]},
    {"name": "setting_type_kwargs", "symbols": ["setting_type_kwargs$ebnf$3", "setting_type_kwargs$subexpression$3"], "postprocess": d => FromMultiple(d[1], d[0], p => p[0])},
    {"name": "setting_type_vec34", "symbols": [{"literal":"drag"}]},
    {"name": "setting_type_vec34", "symbols": [{"literal":"color"}], "postprocess": MkSettingKwarg},
    {"name": "setting_type_kwargs$ebnf$4", "symbols": []},
    {"name": "setting_type_kwargs$ebnf$4$subexpression$1$subexpression$1", "symbols": ["setting_type_string"]},
    {"name": "setting_type_kwargs$ebnf$4$subexpression$1$subexpression$1", "symbols": ["setting_std_optional_kwargs"]},
    {"name": "setting_type_kwargs$ebnf$4$subexpression$1", "symbols": ["setting_type_kwargs$ebnf$4$subexpression$1$subexpression$1", "_"]},
    {"name": "setting_type_kwargs$ebnf$4", "symbols": ["setting_type_kwargs$ebnf$4", "setting_type_kwargs$ebnf$4$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "setting_type_kwargs$subexpression$4", "symbols": ["setting_type_string"]},
    {"name": "setting_type_kwargs$subexpression$4", "symbols": ["setting_std_optional_kwargs"]},
    {"name": "setting_type_kwargs", "symbols": ["setting_type_kwargs$ebnf$4", "setting_type_kwargs$subexpression$4"], "postprocess": d => FromMultiple(d[1], d[0], p => p[0])},
    {"name": "setting_type_string", "symbols": [{"literal":"multiline"}]},
    {"name": "setting_type_string", "symbols": [{"literal":"password"}]},
    {"name": "setting_type_string$subexpression$1", "symbols": [(lexer.has("dqstring") ? {type: "dqstring"} : dqstring)]},
    {"name": "setting_type_string$subexpression$1", "symbols": [(lexer.has("sqstring") ? {type: "sqstring"} : sqstring)]},
    {"name": "setting_type_string$subexpression$1$ebnf$1", "symbols": [(lexer.has("op_binary_sum") ? {type: "op_binary_sum"} : op_binary_sum)], "postprocess": id},
    {"name": "setting_type_string$subexpression$1$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "setting_type_string$subexpression$1", "symbols": ["setting_type_string$subexpression$1$ebnf$1", "const_number"]},
    {"name": "setting_type_string", "symbols": [{"literal":"max"}, (lexer.has("op_assignment") ? {type: "op_assignment"} : op_assignment), "setting_type_string$subexpression$1"], "postprocess": MkSettingKwarg},
    {"name": "setting_tab_decl$ebnf$1", "symbols": ["settings_tab_kwargs"], "postprocess": id},
    {"name": "setting_tab_decl$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "setting_tab_decl", "symbols": [(lexer.has("lsqbracket") ? {type: "lsqbracket"} : lsqbracket), "_", {"literal":"SettingsTab"}, "_", "setting_tab_decl$ebnf$1", "_", (lexer.has("rsqbracket") ? {type: "rsqbracket"} : rsqbracket)], "postprocess": 
        function(d) { return Compound(d, n.SettingsTabDeclaration, d[4]); }
        },
    {"name": "settings_tab_kwargs$ebnf$1", "symbols": []},
    {"name": "settings_tab_kwargs$ebnf$1$subexpression$1", "symbols": ["settings_tab_kwarg", "_"]},
    {"name": "settings_tab_kwargs$ebnf$1", "symbols": ["settings_tab_kwargs$ebnf$1", "settings_tab_kwargs$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "settings_tab_kwargs", "symbols": ["settings_tab_kwargs$ebnf$1", "settings_tab_kwarg"], "postprocess": 
        (d) => {
            let result = [d[1]];
            if (d[0])
            {
                for (let sub of d[0])
                    result.push(sub[0]);
            }
            return Compound(d, n.SettingsTabKwarg, result);
        }
        },
    {"name": "settings_tab_kwarg$subexpression$1", "symbols": [{"literal":"icon"}]},
    {"name": "settings_tab_kwarg$subexpression$1", "symbols": [{"literal":"name"}]},
    {"name": "settings_tab_kwarg$subexpression$2", "symbols": [(lexer.has("dqstring") ? {type: "dqstring"} : dqstring)]},
    {"name": "settings_tab_kwarg$subexpression$2", "symbols": [(lexer.has("sqstring") ? {type: "sqstring"} : sqstring)]},
    {"name": "settings_tab_kwarg", "symbols": ["settings_tab_kwarg$subexpression$1", (lexer.has("op_assignment") ? {type: "op_assignment"} : op_assignment), "settings_tab_kwarg$subexpression$2"], "postprocess": MkSettingsTabKwarg}
]
  , ParserStart: "optional_statement"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
