# dsh-chat-presets

DeepSeek Harness 的「纯对话」Agent 预设：只聊天，不调用任何工具。可以推到
GitHub，在任意装有 dsh 的机器上复用，不需要 npm 打包，也不需要 pnpm。

## 目录

| 文件 | 作用 |
|---|---|
| `presets.yml` | 两个预设的完整声明（Loader 条目列表），改人设就改这里 |
| `no-tools.js` | 小插件：把宿主层继承来的工具（如 `working_directory`）全部拒绝，保证会话里没有任何可调用的工具 |
| `package.json` | 只声明 `"type": "module"`，让 `no-tools.js` 按 ESM 解析，避免 node 的告警 |
| `README.md` | 本文件 |

两个预设：

| 列表名 | `config.id` | 排序 | 风格 |
|---|---|---|---|
| 猫娘 | `chat` | 5 | 猫娘「奶糖」，软萌粘人、只聊天不调工具 |
| 大肥鱼女仆 | `chat2` | 6 | DeepSeek 鲸鱼娘女仆「大肥鱼」，温吞软糯、只聊天不调工具 |

第一个预设的 `config.id` 仍是 `chat`：只换了名字和人设，已经建好的会话不会因为
找不到预设而失效。想换成 `neko` 之类的干净 id 也行，但那是「新建一个预设」——
老会话会失效，需要先切到别的预设。

每个预设都由三层组成：`persona`（人设即完整系统提示）→ `chat-no-tools`
（屏蔽继承工具）→ `compaction`（长对话自动压缩）。两个预设互不影响，因为
`no-tools` 在各自的作用域里执行。

## 安装

前提：dsh 已装好，并且用的是 `web` profile（预设选择器是 Web 界面的功能）。

把这个仓库 clone 到 web profile 目录里：

```bash
cd ~/.dsh/profiles/web
git clone https://github.com/<你的用户名>/dsh-chat-presets.git
```

Windows（PowerShell / cmd）：

```bat
cd %USERPROFILE%\.dsh\profiles\web
git clone https://github.com/<你的用户名>/dsh-chat-presets.git
```

然后在同目录的 `cordis.patch.yml` 末尾加一行 include：

```yaml
# 纯对话预设：来自独立仓库
- insert:
    - id: chat-presets
      name: cordis:include
      config:
        path: ./dsh-chat-presets/presets.yml
```

保存后 HMR 会重新组合 profile，**新建会话**时在预设选择器里就能看到「纯对话」
和「纯对话 2」。

### 为什么必须放在 profile 目录里

`presets.yml` 里用的是裸包名（`@deepseek-ai/dsh-persona`、
`@deepseek-ai/dsh-compaction-basic`）。Loader 从 include 文件所在目录解析这些
包名，只有文件位于 profile 目录树内时才会回落到 dsh 安装里的插件包。放到
`~/dsh-chat-presets` 这类外部目录也能加载行，但每一行都会是 `inactive`，预设
不会出现在列表里（实测过）。

确实想放到别处的话：在 profile 目录里做一个指向它的软链（Linux/macOS 用
`ln -s`，Windows 需要开发者模式或管理员权限用 `mklink /D`），include 的
`path` 仍写软链的相对路径。

## 验证装好了

- 新会话的预设选择器里出现这两个名字；
- 问它「你现在有哪些工具」，它会说自己没有任何工具；
- 预设列表里看不到，通常是：`path` 写错、文件不在 profile 目录树里，或 dsh
  版本太旧（需要带 `@deepseek-ai/dsh-agent-preset`、`dsh-persona`、
  `dsh-compaction-basic` 的 0.2.x）。

## 更新

```bash
cd ~/.dsh/profiles/web/dsh-chat-presets && git pull
```

再触发一次 profile 重载：改一下 `cordis.patch.yml` 里任意一个**值**（只改注释
有时不会触发），或者重启 dsh。已经开着的会话不会变，新会话使用新内容。

## 卸载

删掉 `cordis.patch.yml` 里那段 `chat-presets` include 行，保存，再删掉
`dsh-chat-presets/` 目录。已经开着的会话在重启后会因为找不到 `chat` /
`chat2` 定义而无法恢复，请先把它们切到别的预设。

## 改预设时注意

- 顶层 `- id: preset-chat` / `preset-chat2` 是 Loader 的编辑地址，保持唯一；
- `config.id`（`chat` / `chat2`）会记录在会话里，改了等于换成一个新预设；
- 想加第三个预设：整块复制，把顶层 `id` 和 `config.id` 都换成新的；
- `name` / `description` / `order` 只影响预设列表里的显示与排序；
- `no-tools` 和 `compaction` 两行建议保留，否则要么会冒出宿主工具，要么长对话
  到上下文上限会直接报错；
- 行内相对路径（`./no-tools.js`）以 `presets.yml` 所在目录为基准。

## 推到 GitHub

```bash
cd ~/.dsh/profiles/web/dsh-chat-presets
git add -A && git commit -m "chat presets"
git branch -M main
git remote add origin git@github.com:<你的用户名>/dsh-chat-presets.git
git push -u origin main
```

## 另一种分发方式（可选）

如果更习惯「一条命令安装」，也可以做成 dsh bundle：把 `presets.yml` 的每个条目
包进 `- insert:` 里作为 `cordis.patch.yml`，并在 `package.json` 里声明
`"dsh": { "bundle": { "patch": "./cordis.patch.yml" } }`，然后在 dsh 里用
`plugin_manager` 的 `install_bundle` 指向这个 git 地址安装。这种方式需要目标
机器上有 pnpm（Desktop 版自带），安装后也不需要把仓库放在 profile 目录里；
本仓库默认的 include 方式则完全不需要包管理器。
