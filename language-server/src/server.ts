'use strict';

import {
    IPCMessageReader, IPCMessageWriter, createConnection, Connection, TextDocuments,
    Diagnostic, DiagnosticSeverity, InitializeResult, TextDocumentPositionParams, CompletionItem,
    CompletionItemKind, SignatureHelp, Hover, DocumentSymbolParams, SymbolInformation,
    WorkspaceSymbolParams, Definition, ExecuteCommandParams, VersionedTextDocumentIdentifier, Location,
    TextDocumentSyncKind, SemanticTokensOptions, SemanticTokensLegend,
    SemanticTokensParams, SemanticTokens, SemanticTokensBuilder, ReferenceOptions, ReferenceParams,
    CodeLens, CodeLensParams, DocumentHighlight, DocumentHighlightKind, DocumentHighlightParams, DidOpenTextDocumentParams,
    RenameParams, WorkspaceEdit, ResponseError, PrepareRenameParams, Range, Position, Command, SemanticTokensDeltaParams,
    SemanticTokensDelta, TextDocumentItem,
    CodeActionParams,
    CodeAction,
    DidCloseTextDocumentParams,
    FileChangeType,
    DidChangeConfigurationParams, TextEdit,
    DocumentColorRegistrationOptions, DocumentColorParams, ColorInformation,
    ColorPresentationParams, ColorPresentation,
    TypeHierarchyItem, TypeHierarchyPrepareParams,
    TypeHierarchySupertypesParams, TypeHierarchySubtypesParams,
    WorkspaceSymbol,
    ProtocolNotificationType0,
    ShowMessageNotification,
    MessageType,
} from 'vscode-languageserver/node';
import { TextDocument, TextDocumentContentChangeEvent } from 'vscode-languageserver-textdocument';

import { Socket } from 'net';
import { URI } from 'vscode-uri'

import * as scriptfiles from './as_parser';
import * as parsedcompletion from './parsed_completion';
import * as typedb from './database';
import * as scriptreferences from './references';
import * as scriptoccurances from './highlight_occurances';
import * as scriptsemantics from './semantic_highlighting';
import * as scriptsymbols from './symbols';
import * as scriptdiagnostics from './ls_diagnostics';
import * as scriptlenses from './code_lenses';
import * as scriptactions from './code_actions';
import * as assets from './assets';
import * as inlayhints from './inlay_hints';
import * as inlinevalues from './inline_values';
import * as colorpicker from './color_picker';
import * as typehierarchy from './type_hierarchy';
import * as fs from 'fs';
import * as os from 'os';
import * as toml from 'toml';
import path = require('path');
import { NotificationType } from 'vscode-languageclient';
// let glob = require('glob');
import * as glob from 'glob';
import * as AdmZip from 'adm-zip';
import { _DEBUG } from './as_parser';

// Create a connection for the server. The connection uses Node's IPC as a transport
let connection: Connection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));

let ParseQueue : Array<scriptfiles.ASModule> = [];
let ParseQueueIndex = 0;
let LoadQueue : Array<scriptfiles.ASModule> = [];
let LoadQueueIndex = 0;
let PostProcessTypesQueue : Array<scriptfiles.ASModule> = [];
let PostProcessTypesQueueIndex = 0;
let ResolveQueue : Array<scriptfiles.ASModule> = [];
let ResolveQueueIndex = 0;
let IsServicingQueues = false;

let ReceivingTypesTimeout : any = null;
let SetTypeTimeout = false;
let UnrealTypesTimedOut = false;

function load_openplanet() {
    LoadOpenplanetJson();
    typedb.AddOpenplanetIcons();
    typedb.AddOpenplanetFuncdefs();
    typedb.AddPrimitiveTypes(false);
}

let JsonLoaded_Core = false;
let JsonLoaded_Next = false;

function LoadOpenplanetJson() {
    const opDir = scriptfiles.GetScriptSettings().getOpNextDir();
    // const opHeader = path.join(opDir, 'Openplanet.h');
    const opCoreJson = path.join(opDir, 'OpenplanetCore.json');
    const opNextJson = path.join(opDir, 'OpenplanetNext.json');

    fs.readFile(opCoreJson, (err, data) => {
        if (err) {
            console.error(`Error reading ${opCoreJson} -- does it exist?`);
            JsonLoaded_Core = true;
        } else {
            typedb.AddTypesFromOpenplanet(JSON.parse(data.toLocaleString()));
            DirtyAllDiagnostics();
            typedb.OnDirtyTypeCaches();
            JsonLoaded_Core = true;
        }
    })

    fs.readFile(opNextJson, (err, data) => {
        if (err) {
            console.error(`Error reading ${opNextJson} -- does it exist?`);
            JsonLoaded_Next = true;
        } else {
            typedb.AddNadeoTypesFromOpenplanet(JSON.parse(data.toLocaleString()));
            DirtyAllDiagnostics();
            typedb.OnDirtyTypeCaches();
            JsonLoaded_Next = true;
        }
    })
}

load_openplanet();

// load_openplanet();

// Create a simple text document manager. The text document manager
// supports full document sync only
// Make the text document manager listen on the connection
// for open, change and close text document events

let shouldSendDiagnosticRelatedInformation: boolean = false;
let RootUris : string[] = [];
let Roots : string[] = [];

// After the server has started the client sends an initialize request. The server receives
// in the passed params the rootPath of the workspace plus the client capabilities.
connection.onInitialize((_params): InitializeResult => {
    shouldSendDiagnosticRelatedInformation = _params.capabilities && _params.capabilities.textDocument && _params.capabilities.textDocument.publishDiagnostics && _params.capabilities.textDocument.publishDiagnostics.relatedInformation;

    if (_params.workspaceFolders == null) {
        Roots.push(_params.rootPath);
        RootUris.push(decodeURIComponent(_params.rootUri));
    } else {
        for (let Workspace of _params.workspaceFolders) {
            Roots.push(URI.parse(Workspace.uri).fsPath);
            RootUris.push(decodeURIComponent(Workspace.uri));
        }
    }

    connection.console.log("Workspace roots: " + Roots);
    console.log("Workspace roots: " + Roots);

    //connection.console.log("RootPath: "+RootPath);
    //connection.console.log("RootUri: "+RootUri+" from "+_params.rootUri);

    // Initially read and parse all angelscript files in the workspace
    let GlobsRemaining = Roots.length;
    for (let RootPath of Roots)
    {
        glob(RootPath + "/**/*.as", null, function (err: any, files: any)
        {
            for (let file of files)
            {
                let uri = getFileUri(file);
                console.warn(`Loading files: ${getModuleName(uri)}, ${file}, ${uri}`);
                let asmodule = scriptfiles.GetOrCreateModule(getModuleName(uri), file, uri);
                LoadQueue.push(asmodule);
            }

            GlobsRemaining -= 1;
            if (GlobsRemaining <= 0)
                TickQueues();
        });

        // Read templates
        glob(RootPath+"/.vscode/templates/*.as.template", null, function(err : any, files : any)
        {
            scriptlenses.LoadFileTemplates(files);
        });

        // Read info.toml
        LoadOpenplanetInfoToml(RootPath+"/info.toml");
    }

    return {
        capabilities: {
            // Tell the client that the server works in FULL text document sync mode
            textDocumentSync: {
                openClose: true,
                change: TextDocumentSyncKind.Incremental,
            },
            // Tell the client that the server support code complete
            completionProvider: {
                resolveProvider: true,
                triggerCharacters: [".", ":"],
            },
            signatureHelpProvider: {
                triggerCharacters: ["(", ")", ","],
                retriggerCharacters: ["="],
            },
            hoverProvider: true,
            documentSymbolProvider: true,
            workspaceSymbolProvider: { "resolveProvider": true },
            definitionProvider: true,
            implementationProvider: true,
            referencesProvider: true,
            documentHighlightProvider: true,
            renameProvider: {
                prepareProvider: true
            },
            codeLensProvider: {
                resolveProvider: false
            },
            executeCommandProvider: {
                // commands: ["angelscript.openAssets"],
                commands: ["angelscript.reloadInfoToml"],
            },
            codeActionProvider: {
                resolveProvider: true,
            },
            semanticTokensProvider: <SemanticTokensOptions> {
                legend: <SemanticTokensLegend> {
                    tokenTypes: scriptsemantics.SemanticTypeList.map(t => "as_"+t),
                    tokenModifiers: [],
                },
                range: false,
                full: {
                    delta: true,
                },
            },
            colorProvider : <DocumentColorRegistrationOptions> {
                documentSelector: null,
            },
            typeHierarchyProvider: true,
        }
    }
});

function LoadOpenplanetInfoToml(file: string) {
    fs.readFile(file, 'utf-8', (err, data) => {
        if (err)
            return connection.sendNotification(
                ShowMessageNotification.type,
                { message: "Could not find info.toml! Please use the `Reload info.toml` command after you add it if you need imports. I looked for it at `" + file + "`",
                type: MessageType.Warning
                });
        let info: any;
        try {
            info = toml.parse(data);
        } catch (err) {
            return connection.sendNotification(
                ShowMessageNotification.type,
                { message: "Could not read info.toml! Please use the `Reload info.toml` command after you fix syntax etc if you need imports. I looked for it at `" + file + "`",
                type: MessageType.Warning
                });
        }
        let deps: string[] = [];
        if (info.script) deps = [...(info?.script?.dependencies || []), ...(info?.script?.optional_dependencies || [])];
        LoadOpenplanetDependencies(deps);
    })
}

// let LoadedDependencies = new Map<string, scriptfiles.ASModule[]>();

function LoadOpenplanetDependencies(deps: string[]) {
    if (deps.length == 0) return;

    let opRoot = scriptfiles.GetScriptSettings().getOpNextDir();
    let opPlugins = scriptfiles.GetScriptSettings().getOpNextPluginsDir();
    let opUserPluginsDir = path.join(opRoot, "Plugins");
    console.log(JSON.stringify({opPlugins, opUserPluginsDir}))

    let depDirsToCheck: string[] = [];
    let allowedDeps = new Set<string>(deps);
    let foundDeps = new Set<string>();

    function AddDepencyIfUnmet(dir: string) {
        while (dir.endsWith("/")) {
            dir = dir.slice(0, -1);
        }
        let parts = dir.split('/');
        let pluginName = parts[parts.length - 1];
        if (allowedDeps.has(pluginName) && !foundDeps.has(pluginName)) {
            foundDeps.add(pluginName);
            depDirsToCheck.push(dir);
        }
    }

    // plugins as directories
    // these have precedence over .op files
    glob.sync(path.join(opPlugins, "*/")).forEach(AddDepencyIfUnmet);
    glob.sync(path.join(opUserPluginsDir, "*/")).forEach(AddDepencyIfUnmet);

    // plugins as .op files
    let files = glob.sync(opUserPluginsDir+"/*.op");
    files.forEach(pluginFile => {
        // extract to a tmp dir
        let pluginFileName = path.basename(pluginFile, ".op");
        if (!allowedDeps.has(pluginFileName) || foundDeps.has(pluginFileName)) // don't need it or already have it
            return;
        let tmpDir = path.join(os.tmpdir(), "vscode-op-as", pluginFileName);
        let tmpDir_ = path.join(tmpDir, " ").trimEnd();
        // console.info(`Clearing tmp directory: ${tmpDir}`);
        fs.mkdirSync(tmpDir, {recursive: true});
        // console.info(`Extracting ${pluginFile} to ${tmpDir}`);
        let archive = new AdmZip(pluginFile)
        archive.extractAllTo(tmpDir, true)
        let filesInArchive: string[] = [];
        archive.forEach(entry => {
            if (!entry.isDirectory) filesInArchive.push(entry.entryName);
        })
        let as_files = glob.sync(tmpDir+"/**/*.as")
        as_files.forEach(file => {
            let relativePath = file.replace(tmpDir_, "");
            if (!filesInArchive.includes(relativePath)) {
                fs.rmSync(file);
                console.log(`removed old file while extracting .op: ${file}; (rp: ${relativePath}, zip path example: ${filesInArchive[0]})`);
            }
        })
        AddDepencyIfUnmet(tmpDir_)
    })

    // load dependency stuff
    console.log(`loading ${depDirsToCheck.length} plugins in directories`); // : ${JSON.stringify(depDirsToCheck)}
    let asFilesToLoad = depDirsToCheck.flatMap(FilesToLoadForDependency).filter(v => v != null);
    console.log(`individual dependency files to load: ${JSON.stringify(asFilesToLoad)}`);
    let modules = asFilesToLoad.map(LoadDependencyModule);
    modules.forEach(scriptfiles.UpdateModuleFromDisk);
    let doParse = () => {
        modules.forEach(m => scriptfiles.ParseModule(m, _DEBUG));
        setTimeout(doPostProcess, 1);
    };
    let doPostProcess = () => {
        modules.forEach(scriptfiles.PostProcessModuleTypes);
        setTimeout(doResolveModules, 1);
    };
    let doResolveModules = () => {
        modules.forEach(scriptfiles.ResolveModule);
        setTimeout(doUpdateScriptDiagnostics, 1);
    };
    let doUpdateScriptDiagnostics = () => {
        modules.forEach(m => scriptdiagnostics.UpdateScriptModuleDiagnostics(m, true));
        setTimeout(() => {
            typedb.OnDirtyTypeCaches();
            DirtyAllDiagnostics();
            console.log(`Imported types from ${asFilesToLoad.length} dependency files.`);
        }, 1);
    };
    doParse();
}

function FilesToLoadForDependency(pluginDir: string): string[] {
    let info;
    try {
        let content = fs.readFileSync(path.join(pluginDir, "info.toml"), 'utf-8');
        info = toml.parse(content);
    } catch (err) {
        console.warn(`Error loading info.toml from ${pluginDir}\n  > ${err}`);
    }
    if (!info?.script) return;
    let filesToLoad: string[] = [...(info.script.exports || []), ...(info.script.shared_exports || [])];
    // filter out VehicleState/StateWrappers.as as it interferes with definition from OpenplanetNext.json
    return filesToLoad.filter(v => v != "StateWrappers.as").map(f => path.join(pluginDir, f));
}

function LoadDependencyModule(file: string): scriptfiles.ASModule {
    let uri = getFileUri(file);
    console.warn(`Loading Dependency Files: ${getModuleName(file)}, ${file}, ${uri}`);
    return scriptfiles.GetOrCreateModule(getModuleName(uri), file, uri);
}


// function LoadPluginAsDependency(pluginDir: string) {
//     filesToLoad.forEach(toLoad => {
//         let loadPath = path.join(pluginDir, toLoad);
//         let file = loadPath;
//         let uri = getFileUri(file);
//         // let file = `file://${loadPath.startsWith("/") ? "" : "/"}${loadPath}`;
//         console.warn(`Loading files: ${getModuleName(file)}, ${file}, ${uri}`);
//         let asmodule = scriptfiles.GetOrCreateModule(getModuleName(uri), file, uri);
//         asmodule.markDependencyModule
//         scriptfiles.ParseModuleAndDependencies(asmodule)
//         scriptfiles.PostProcessModuleTypes(asmodule)
//         scriptfiles.ResolveModule(asmodule)
//         scriptdiagnostics.UpdateScriptModuleDiagnostics(asmodule)
//     })
// }

function TickQueues()
{
    IsServicingQueues = true;

    if (LoadQueueIndex < LoadQueue.length)
    {
        for (let n = 0; n < 10 && LoadQueueIndex < LoadQueue.length; ++n, ++LoadQueueIndex)
        {
            if (!LoadQueue[LoadQueueIndex].loaded)
                scriptfiles.UpdateModuleFromDisk(LoadQueue[LoadQueueIndex]);
            ParseQueue.push(LoadQueue[LoadQueueIndex]);
        }
    }
    else if (LoadQueue.length != 0)
    {
        LoadQueue = [];
        LoadQueueIndex = 0;
    }
    else if (ParseQueueIndex < ParseQueue.length)
    {
        for (let n = 0; n < 5 && ParseQueueIndex < ParseQueue.length; ++n, ++ParseQueueIndex)
        {
            if (!ParseQueue[ParseQueueIndex].parsed)
                scriptfiles.ParseModule(ParseQueue[ParseQueueIndex], _DEBUG);
            PostProcessTypesQueue.push(ParseQueue[ParseQueueIndex]);
        }
    }
    else if (ParseQueue.length != 0)
    {
        ParseQueue = [];
        ParseQueueIndex = 0;
        scriptfiles.SetInitialParseDone();
    }
    else if (PostProcessTypesQueueIndex < PostProcessTypesQueue.length)
    {
        if (CanResolveModules())
        {
            for (let n = 0; n < 5 && PostProcessTypesQueueIndex < PostProcessTypesQueue.length; ++n, ++PostProcessTypesQueueIndex)
            {
                if (!PostProcessTypesQueue[PostProcessTypesQueueIndex].typesPostProcessed)
                    scriptfiles.PostProcessModuleTypes(PostProcessTypesQueue[PostProcessTypesQueueIndex]);
                ResolveQueue.push(PostProcessTypesQueue[PostProcessTypesQueueIndex]);
            }
        }
    }
    else if (PostProcessTypesQueue.length != 0)
    {
        PostProcessTypesQueue = [];
        PostProcessTypesQueueIndex = 0;
    }
    else if (ResolveQueueIndex < ResolveQueue.length)
    {
        if (CanResolveModules())
        {
            for (let n = 0; n < 1 && ResolveQueueIndex < ResolveQueue.length; ++n, ++ResolveQueueIndex)
            {
                if (!ResolveQueue[ResolveQueueIndex].resolved)
                {
                    scriptfiles.ResolveModule(ResolveQueue[ResolveQueueIndex]);
                    scriptdiagnostics.UpdateScriptModuleDiagnostics(ResolveQueue[ResolveQueueIndex], true);
                }
            }
        }
    }
    else if (ResolveQueue.length != 0)
    {
        ResolveQueue = [];
        ResolveQueueIndex = 0;
    }

    if (LoadQueue.length != 0 || ParseQueue.length != 0 || PostProcessTypesQueue.length != 0)
        setTimeout(TickQueues, 1);
    else if (ResolveQueue.length != 0)
        setTimeout(TickQueues, 2);
    else
        IsServicingQueues = false;
}

function DirtyAllDiagnostics()
{
    if (IsServicingQueues)
        return;

    // Update diagnostics on all modules
    let moduleIndex = 0;
    let moduleList = scriptfiles.GetAllLoadedModules();
    let timerHandle = setInterval(UpdateDiagnostics, 1);

    function UpdateDiagnostics()
    {
        if (moduleIndex >= moduleList.length)
        {
            clearInterval(timerHandle);
            return;
        }

        let module = moduleList[moduleIndex];
        if (module && module.resolved)
            scriptdiagnostics.UpdateScriptModuleDiagnostics(module);
        moduleIndex += 1;
    }
}

function ReResolveAllModules()
{
    if (IsServicingQueues)
        return;

    scriptfiles.ClearAllResolvedModules();

    // Update diagnostics on all modules
    let moduleIndex = 0;
    let moduleList = scriptfiles.GetAllLoadedModules();
    let timerHandle = setInterval(ReResolveModules, 1);

    function ReResolveModules()
    {
        if (moduleIndex >= moduleList.length)
        {
            clearInterval(timerHandle);
            return;
        }

        let module = moduleList[moduleIndex];
        if (module && !module.resolved)
        {
            scriptfiles.ResolveModule(module);
            scriptdiagnostics.UpdateScriptModuleDiagnostics(module);
        }

        moduleIndex += 1;
    }
}

function CanResolveModules()
{
    return LoadQueue.length == 0;
}

function IsInitialParseDone()
{
    return CanResolveModules() && ParseQueue.length == 0 && LoadQueue.length == 0;
}

scriptdiagnostics.OnDiagnosticsChanged( function (uri : string, diagnostics : Array<Diagnostic>){
    connection.sendDiagnostics({ "uri": uri, "diagnostics": diagnostics });
});

connection.onDidChangeWatchedFiles((_change) => {
    for(let change of _change.changes)
    {
        let module = scriptfiles.GetOrCreateModule(getModuleName(change.uri), getPathName(change.uri), change.uri);
        if (module)
        {
            if (!module.isOpened)
                scriptfiles.UpdateModuleFromDisk(module);
            scriptfiles.ParseModule(module);

            if (CanResolveModules() && ParseQueue.length == 0 && LoadQueue.length == 0)
            {
                scriptfiles.PostProcessModuleTypes(module);
                scriptfiles.ResolveModule(module);

                let alwaysSendDiagnostics = false;
                if (change.type == FileChangeType.Deleted)
                    alwaysSendDiagnostics = true;
                if (change.type == FileChangeType.Created)
                    alwaysSendDiagnostics = true;

                scriptdiagnostics.UpdateScriptModuleDiagnostics(module, false, alwaysSendDiagnostics);
            }
        }
    }
});

function GetAndParseModule(uri : string) : scriptfiles.ASModule
{
    let asmodule = scriptfiles.GetModuleByUri(uri);
    if (!asmodule)
        return null;

    scriptfiles.ParseModuleAndDependencies(asmodule);
    if (CanResolveModules())
    {
        scriptfiles.PostProcessModuleTypesAndDependencies(asmodule);
        scriptfiles.ResolveModule(asmodule);
    }
    return asmodule;
}

connection.onCompletion((_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
    let asmodule = GetAndParseModule(_textDocumentPosition.textDocument.uri);
    if (!asmodule)
        return null;
    let completions = parsedcompletion.Complete(asmodule, _textDocumentPosition.position);
    return completions;
});

connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
    return parsedcompletion.Resolve(item);
});

connection.onSignatureHelp((_textDocumentPosition: TextDocumentPositionParams): SignatureHelp => {
    let asmodule = GetAndParseModule(_textDocumentPosition.textDocument.uri);
    if (!asmodule)
        return null;
    let help = parsedcompletion.Signature(asmodule, _textDocumentPosition.position);
    return help;
});

connection.onDefinition((_textDocumentPosition: TextDocumentPositionParams): Definition | null => {
    let asmodule = GetAndParseModule(_textDocumentPosition.textDocument.uri);
    if (!asmodule)
        return null;
    if (!asmodule.resolved)
        return null;
    let definitions = scriptsymbols.GetDefinition(asmodule, _textDocumentPosition.position);
    if (definitions && definitions.length == 1)
        return definitions[0];
    return definitions;
});

connection.onImplementation((_textDocumentPosition: TextDocumentPositionParams): Definition | null => {
    let asmodule = GetAndParseModule(_textDocumentPosition.textDocument.uri);
    if (!asmodule)
        return null;
    if (!asmodule.resolved)
        return null;
    let definitions = scriptsymbols.GetDefinition(asmodule, _textDocumentPosition.position);
    if (definitions && definitions.length != 0)
    {
        if (definitions.length == 1)
            return definitions[0];
        return definitions;
    }

    let cppSymbol = scriptsymbols.GetCppSymbol(asmodule, _textDocumentPosition.position);
    if (cppSymbol)
    {
        // the unreal editor with the type and symbol we've resolved that we want.
        // if (unreal)
        //     unreal.write(buildGoTo(cppSymbol[0], cppSymbol[1]));
    }

    return null;
});

connection.onHover((_textDocumentPosition: TextDocumentPositionParams): Hover => {
    let asmodule = GetAndParseModule(_textDocumentPosition.textDocument.uri);
    if (!asmodule)
        return null;
    if (!asmodule.resolved)
        return null;
    return scriptsymbols.GetHover(asmodule, _textDocumentPosition.position);
});

connection.onDocumentSymbol((_params : DocumentSymbolParams) : SymbolInformation[] => {
    let asmodule = GetAndParseModule(_params.textDocument.uri);
    if (!asmodule)
        return null;
    return scriptsymbols.DocumentSymbols(asmodule);
});

connection.onWorkspaceSymbol((_params : WorkspaceSymbolParams) : WorkspaceSymbol[] => {
    return scriptsymbols.WorkspaceSymbols(_params.query);
});

connection.onWorkspaceSymbolResolve((symbol : WorkspaceSymbol) : WorkspaceSymbol => {
    return scriptsymbols.ResolveWorkspaceSymbol(symbol);
});

connection.onReferences(function (params : ReferenceParams) : Location[] | Thenable<Location[]>
{
    if (!CanResolveModules())
        return null;
    if (LoadQueue.length != 0)
        return null;

    let generator = scriptreferences.FindReferences(params.textDocument.uri, params.position);
    let result = generator.next();
    if (result && result.value)
        return result.value;

    return new Promise((resolve, reject) => {
        let timerHandle = setInterval(MakeProgress, 1);
        function MakeProgress()
        {
            let result = generator.next();
            if (result && result.value)
            {
                clearInterval(timerHandle);
                resolve(result.value);
            }
        }
    });
});

connection.onPrepareRename(function (params : PrepareRenameParams) : Range | ResponseError<void>
{
    if (!CanResolveModules())
        return null;
    if (LoadQueue.length != 0)
        return null;

    let result : Range | ResponseError<void> = null;
    if (!CanResolveModules())
        result = new ResponseError<void>(0, "Please wait for all script parsing to finish...");
    else
        result = scriptreferences.PrepareRename(params.textDocument.uri, params.position);

    return result;
});

connection.onRenameRequest(function (params : RenameParams) : WorkspaceEdit | Thenable<WorkspaceEdit>
{
    if (!CanResolveModules())
        return null;
    if (LoadQueue.length != 0)
        return null;

    let generator = scriptreferences.PerformRename(params.textDocument.uri, params.position, params.newName);
    return new Promise((resolve, reject) => {
        let timerHandle = setInterval(MakeProgress, 1);
        function MakeProgress()
        {
            let result = generator.next();
            if (result && result.value)
            {
                clearInterval(timerHandle);

                let workspaceEdit : WorkspaceEdit = {};
                workspaceEdit.changes = {};
                for (let [uri, edits] of result.value)
                    workspaceEdit.changes[uri] = edits;
                resolve(workspaceEdit);
            }
        }
    });
});

connection.onDocumentHighlight(function (params : DocumentHighlightParams) : Array<DocumentHighlight>
{
    if (!CanResolveModules())
        return null
    return scriptoccurances.HighlightOccurances(params.textDocument.uri, params.position);
})

connection.onCodeLens(function (params : CodeLensParams) : CodeLens[]
{
    if (!CanResolveModules())
        return null;
    let asmodule = scriptfiles.GetModuleByUri(params.textDocument.uri);
    if (!asmodule)
        return null;

    scriptfiles.ParseModuleAndDependencies(asmodule);
    scriptfiles.PostProcessModuleTypesAndDependencies(asmodule);
    scriptfiles.ResolveModule(asmodule);
    return scriptlenses.ComputeCodeLenses(asmodule);
})

connection.onCodeLensResolve(function (lens : CodeLens) : CodeLens{
    return lens;
});

connection.onExecuteCommand(function (params : ExecuteCommandParams)
{
    if (params.command == "angelscript.reloadInfoToml") {
        for (let RootPath of Roots) {
            LoadOpenplanetInfoToml(RootPath+"/info.toml");
        }
    }

    // if (params.command == "angelscript.openAssets")
    // {
    //     if (params.arguments && params.arguments[0])
    //     {
    //         let argList = params.arguments as Array<any>;
    //         let references = assets.GetAssetsImplementing(argList[0]);
    //         if (!references || references.length == 0)
    //             return;

    //         if (unreal)
    //             unreal.write(buildOpenAssets(references));
    //         else
    //             connection.window.showErrorMessage("Cannot open asset: not connected to unreal editor.");
    //     }
    // }
});

connection.onCodeAction(function (params : CodeActionParams) : Array<CodeAction>
{
    let asmodule = GetAndParseModule(params.textDocument.uri);
    if (!asmodule)
        return null;
    if (!asmodule.resolved)
        return null;

    return scriptactions.GetCodeActions(asmodule, params.range, params.context.diagnostics);
});

connection.onCodeActionResolve(function (action : CodeAction) : CodeAction
{
    let data = action.data as any;
    if (!data || !data.uri)
        return action;
    let asmodule = GetAndParseModule(data.uri);
    if (!asmodule)
        return action;
    if (!asmodule.resolved)
        return action;

    return scriptactions.ResolveCodeAction(asmodule, action, data);
});

function TryResolveSymbols(asmodule : scriptfiles.ASModule) : SemanticTokens | null
{
    if (CanResolveModules())
    {
        if (!asmodule)
            return null;
        scriptfiles.ParseModuleAndDependencies(asmodule);
        scriptfiles.PostProcessModuleTypesAndDependencies(asmodule);
        scriptfiles.ResolveModule(asmodule);
        return scriptsemantics.HighlightSymbols(asmodule);
    }
    else
    {
        return null;
    }
}

function WaitForResolveSymbols(params : SemanticTokensParams) : SemanticTokens | Thenable<SemanticTokens>
{
    let asmodule = scriptfiles.GetModuleByUri(params.textDocument.uri);
    let result = TryResolveSymbols(asmodule);
    if (result)
        return result;

    function timerFunc(resolve : any, reject : any, triesLeft : number) {
        let result = TryResolveSymbols(asmodule);
        if (result)
            return resolve(result);
        setTimeout(function() { timerFunc(resolve, reject, triesLeft-1); }, 100);
    }
    let promise = new Promise<SemanticTokens>(function(resolve, reject)
    {
        timerFunc(resolve, reject, 50);
    });
    return promise;
};

connection.languages.semanticTokens.onDelta(function (params : SemanticTokensDeltaParams) : SemanticTokensDelta | Thenable<SemanticTokensDelta> | SemanticTokens | Thenable<SemanticTokens>
{
    if (!CanResolveModules())
        return WaitForResolveSymbols(params);

    let asmodule = scriptfiles.GetModuleByUri(params.textDocument.uri);
    scriptfiles.ParseModuleAndDependencies(asmodule);
    scriptfiles.PostProcessModuleTypesAndDependencies(asmodule);
    scriptfiles.ResolveModule(asmodule);
    let delta = scriptsemantics.HighlightSymbolsDelta(asmodule, params.previousResultId);
    return delta;
});

connection.languages.semanticTokens.on(function(params : SemanticTokensParams) : SemanticTokens | Thenable<SemanticTokens>
{
    return WaitForResolveSymbols(params);
});

function getPathName(uri : string) : string
{
    let pathname = decodeURIComponent(uri.replace("file://", "")).replace(/\//g, "\\");
    if(pathname.startsWith("\\"))
        pathname = pathname.substr(1);

    return pathname;
}

function getFileUri(pathname : string) : string
{
    let uri = pathname.replace(/\\/g, "/");
    if(!uri.startsWith("/"))
        uri = "/" + uri;

    return ("file://" + uri);
}

function getModuleName(uri : string) : string
{
    let modulename = decodeURIComponent(uri);

    // This assumes all relative paths are globally unique.
    for (let rootUri of RootUris) {
        if (modulename.startsWith(rootUri)) {
            modulename = modulename.replace(rootUri, "");
            break;
        }
    }
    modulename = modulename.replace(".as", "");
    modulename = modulename.replace(/\//g, ".");

    if (modulename[0] == '.')
        modulename = modulename.substr(1);

    return modulename;
}

connection.onRequest("angelscript/getModuleForSymbol", (...params: any[]) : string => {
    let pos : TextDocumentPositionParams = params[0];
    let asmodule = GetAndParseModule(pos.textDocument.uri);
    if (!asmodule)
        return null;
    if (!asmodule.resolved)
        return null;

    // When automatic imports are on we never return the symbol at all
    if (scriptfiles.GetScriptSettings().automaticImports)
        return "-";

    // See if we can find an unimported symbol on this line first
    let unimportedSymbol = scriptsymbols.FindUnimportedSymbolOnLine(asmodule, pos.position);
    if (unimportedSymbol)
    {
        let symbolDefs = scriptsymbols.GetSymbolDefinition(asmodule, unimportedSymbol);
        if (symbolDefs)
        {
            for (let def of symbolDefs)
            {
                if (def.module.modulename == asmodule.modulename)
                    continue;
                return def.module.modulename;
            }
        }
    }

    // Fall back to grabbing it by definition
    let definitions = scriptsymbols.GetDefinition(asmodule, pos.position);
    if (definitions == null)
    {
        connection.console.log(`Definition not found`);
        return "";
    }
    {
        let defArray = definitions as Location[];
        let moduleName = getModuleName(defArray[0].uri);

        // Don't add an import to the module we're in
        if (moduleName == asmodule.modulename)
            return "-";
        return moduleName;
    }
});

connection.onRequest("angelscript/provideInlineValues", (...params: any[]) : any[] => {
    let pos : TextDocumentPositionParams = params[0];
    let asmodule = GetAndParseModule(pos.textDocument.uri);
    if (!asmodule)
        return null;
    if (!asmodule.resolved)
        return null;
    return inlinevalues.ProvideInlineValues(asmodule, pos.position);
});

 connection.onDidChangeTextDocument((params) => {
    // The content of a text document did change in VSCode.
    // params.uri uniquely identifies the document.
    // params.contentChanges describe the content changes to the document.
    console.log(JSON.stringify(params))
    if (params.contentChanges.length == 0)
        return;

    let uri = params.textDocument.uri;
    let modulename = getModuleName(uri);

    let asmodule = scriptfiles.GetOrCreateModule(modulename, getPathName(uri), uri);
    if (!asmodule.loaded)
        scriptfiles.UpdateModuleFromDisk(asmodule);
    scriptfiles.UpdateModuleFromContentChanges(asmodule, params.contentChanges);

    if (!asmodule.queuedParse)
    {
        // We don't parse because of didChange more than 3 times per second,
        // so we don't end up with a giant backlog of parses.
        asmodule.queuedParse = setTimeout(function() {
            asmodule.queuedParse = null;
            scriptfiles.ParseModuleAndDependencies(asmodule);
            if (CanResolveModules() && ParseQueue.length == 0 && LoadQueue.length == 0)
            {
                scriptfiles.PostProcessModuleTypesAndDependencies(asmodule);
                scriptfiles.ResolveModule(asmodule);
                scriptdiagnostics.UpdateScriptModuleDiagnostics(asmodule);
            }
        }, 100);
    }

    if (asmodule.lastEditStart != -1 && parsedcompletion.GetCompletionSettings().correctFloatLiteralsWhenExpectingDoublePrecision)
    {
        let floatPromise = parsedcompletion.HandleFloatLiteralHelper(asmodule);
        if (floatPromise)
        {
            floatPromise.then(
                function (edit : WorkspaceEdit)
                {
                    if (edit)
                        connection.workspace.applyEdit(edit);
                });
        }
    }
 });

 connection.onDidOpenTextDocument(function (params : DidOpenTextDocumentParams)
 {
    let uri = params.textDocument.uri;
    let modulename = getModuleName(uri);

    let asmodule = scriptfiles.GetOrCreateModule(modulename, getPathName(uri), uri);
    asmodule.isOpened = true;
    scriptfiles.UpdateModuleFromDisk(asmodule);
    scriptfiles.ParseModuleAndDependencies(asmodule);
    if (CanResolveModules() && ParseQueue.length == 0 && LoadQueue.length == 0)
    {
        scriptfiles.PostProcessModuleTypesAndDependencies(asmodule);
        scriptfiles.ResolveModule(asmodule);
        scriptdiagnostics.UpdateScriptModuleDiagnostics(asmodule);
    }
 });

 connection.onDidCloseTextDocument(function (params : DidCloseTextDocumentParams)
 {
    let asmodule = scriptfiles.GetModuleByUri(params.textDocument.uri);
    if (asmodule)
        asmodule.isOpened = false;
 });

 connection.onDidChangeConfiguration(function (change : DidChangeConfigurationParams)
 {
    let settingsObject = change.settings as any;
    let settings : any = settingsObject.OpenplanetAngelscript;
    if (!settings)
        return;

    let diagnosticSettings = scriptdiagnostics.GetDiagnosticSettings();
    let scriptSettings = scriptfiles.GetScriptSettings();
    let dirtyDiagnostics = false;

    if (scriptSettings.openplanetNextLocation != settings.openplanetNextLocation
      || diagnosticSettings.markUnreadVariablesAsUnused != settings.helper.markUnreadVariablesAsUnused
      || diagnosticSettings.squiggleUnparsableStatements != settings.parser.squiggleUnparsableStatements) {
        dirtyDiagnostics = true;
    }
    scriptSettings.openplanetNextLocation = settings.openplanetNextLocation;
    scriptSettings.openplanetNextPluginsLocation = settings.openplanetNextPluginsLocation;
    scriptSettings.enableDebugOutput = settings.parser.enableDebugOutput;
    scriptSettings.crashOnParseError = settings.parser.crashOnParseError;
    diagnosticSettings.squiggleUnparsableStatements != settings.parser.squiggleUnparsableStatements;

    diagnosticSettings.markUnreadVariablesAsUnused != settings.helper.markUnreadVariablesAsUnused;

    if (dirtyDiagnostics)
        DirtyAllDiagnostics();

    let completionSettings = parsedcompletion.GetCompletionSettings();
    completionSettings.mathCompletionShortcuts = settings.helper.mathCompletionShortcuts;
    completionSettings.correctFloatLiteralsWhenExpectingDoublePrecision = settings.helper.correctFloatLiteralsWhenExpectingDoublePrecision;

    let inlayHintSettings = inlayhints.GetInlayHintSettings();
    inlayHintSettings.inlayHintsEnabled = settings.inlayHints.inlayHintsEnabled;
    inlayHintSettings.parameterHintsForConstants = settings.inlayHints.parameterHintsForConstants;
    inlayHintSettings.parameterHintsForComplexExpressions = settings.inlayHints.parameterHintsForComplexExpressions;
    inlayHintSettings.parameterReferenceHints = settings.inlayHints.parameterReferenceHints;
    inlayHintSettings.parameterHintsForSingleParameterFunctions = settings.inlayHints.parameterHintsForSingleParameterFunctions;
    inlayHintSettings.typeHintsForAutos = settings.inlayHints.typeHintsForAutos;
    inlayHintSettings.parameterHintsIgnoredParameterNames = new Set<string>(settings.inlayHints.parameterHintsIgnoredParameterNames as Array<string>);
    inlayHintSettings.parameterHintsIgnoredFunctionNames = new Set<string>(settings.inlayHints.parameterHintsIgnoredFunctionNames as Array<string>);

    let inlineValueSettings = inlinevalues.GetInlineValueSettings();
    inlineValueSettings.showInlineValueForFunctionThisObject = settings.inlineValues.showInlineValueForFunctionThisObject;
    inlineValueSettings.showInlineValueForLocalVariables = settings.inlineValues.showInlineValueForLocalVariables;
    inlineValueSettings.showInlineValueForParameters = settings.inlineValues.showInlineValueForParameters;
    inlineValueSettings.showInlineValueForMemberAssignment = settings.inlineValues.showInlineValueForMemberAssignment;
 });

function TryResolveInlayHints(asmodule : scriptfiles.ASModule, range : Range) : Array<inlayhints.ASInlayHint> | null
{
    if (CanResolveModules())
    {
        if (!asmodule)
            return null;
        scriptfiles.ParseModuleAndDependencies(asmodule);
        scriptfiles.PostProcessModuleTypesAndDependencies(asmodule);
        scriptfiles.ResolveModule(asmodule);
        return inlayhints.GetInlayHintsForRange(asmodule, range);
    }
    else
    {
        return null;
    }
}

function WaitForInlayHints(uri : string, range : Range) : Array<inlayhints.ASInlayHint> | Thenable<Array<inlayhints.ASInlayHint>>
{
    let asmodule = scriptfiles.GetModuleByUri(uri);
    let result = TryResolveInlayHints(asmodule, range);
    if (result)
        return result;

    function timerFunc(resolve : any, reject : any, triesLeft : number) {
        let result = TryResolveInlayHints(asmodule, range);
        if (result)
            return resolve(result);
        setTimeout(function() { timerFunc(resolve, reject, triesLeft-1); }, 100);
    }
    let promise = new Promise<Array<inlayhints.ASInlayHint>>(function(resolve, reject)
    {
        timerFunc(resolve, reject, 50);
    });
    return promise;
};

connection.onRequest("angelscript/inlayHints", (...params: any[]) : Array<inlayhints.ASInlayHint> | Thenable<Array<inlayhints.ASInlayHint>> => {
    let uri : string = params[0].uri;
    let start : Position = params[0].start;
    let end : Position = params[0].end;
    return WaitForInlayHints(uri, Range.create(start, end));
});

connection.onDocumentColor(function (params : DocumentColorParams) : ColorInformation[]
{
    let asmodule = GetAndParseModule(params.textDocument.uri);
    if (!asmodule)
        return null;
    if (!asmodule.resolved)
        return null;

    return colorpicker.ProvideDocumentColors(asmodule);
});

connection.onColorPresentation(function(params : ColorPresentationParams) : ColorPresentation[]
{
    let asmodule = GetAndParseModule(params.textDocument.uri);
    if (!asmodule)
        return null;
    if (!asmodule.resolved)
        return null;

    return colorpicker.ProvideColorPresentations(asmodule, params.range, params.color);
});

connection.languages.typeHierarchy.onPrepare(function (params : TypeHierarchyPrepareParams) : TypeHierarchyItem[]
{
    let asmodule = GetAndParseModule(params.textDocument.uri);
    if (!asmodule)
        return null;
    if (!asmodule.resolved)
        return null;

    return typehierarchy.PrepareTypeHierarchy(asmodule, params.position);
});

connection.languages.typeHierarchy.onSupertypes(function (params : TypeHierarchySupertypesParams) : TypeHierarchyItem[]
{
    return typehierarchy.GetTypeHierarchySupertypes(params.item);
});

connection.languages.typeHierarchy.onSubtypes(function (params : TypeHierarchySubtypesParams) : TypeHierarchyItem[]
{
    return typehierarchy.GetTypeHierarchySubtypes(params.item);
});

// Listen on the connection
connection.listen();
