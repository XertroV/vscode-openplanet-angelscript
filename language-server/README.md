# Openplanet Angelscript Language Server

**NOTE:** You do NOT need to do this if you just want to use the VS Code Extension.

## Installing the Language Server Independently

```sh
npm install
npm package
```

This should create a file called `openplanet-angelscript-ls-1.0.0.tgz` which can be installed by running:

```sh
npm install -g openplanet-angelscript-ls-1.0.0.tgz
```

## Usage Examples

### Neovim with [nvim-lspconfig](https://github.com/neovim/nvim-lspconfig)

```lua
-- add filetype "angelscript" for .as files which have "info.toml" in project root

vim.filetype.add({
  extension = {
    as = function(path, _)
      if vim.fs.find({ "info.toml" }, {
        upward = true,
        path = path,
      })[1] then
        vim.o.commentstring = "// %s"
        return "angelscript"
      end
    end,
  },
})

-- add angelscript lsp

local lsp_configurations = require("lspconfig.configs")
if not lsp_configurations.openplanet_angelscript_ls then
  lsp_configurations.openplanet_angelscript_ls = {
    default_config = {
      name = "openplanet_angelscript_ls",
      cmd = { "openplanet-angelscript-ls", "--stdio" },
      init_options = { hostInfo = "neovim" },
      filetypes = { "angelscript" },
      root_dir = require("lspconfig.util").root_pattern("info.toml"),
    },
  }
end

-- set environment variables for openplanet dirs

require("lspconfig").openplanet_angelscript_ls.setup({
  cmd_env = {
    OPENPLANET_NEXT_DIR = "/path/to/OpenplanetNext/",
    OPENPLANET_PLUGINS_DIR = "/path/to/Trackmania/Openplanet/Plugins/",
  },
})
```
