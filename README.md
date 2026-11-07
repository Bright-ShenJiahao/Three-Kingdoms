# 无名三国录：幸存者

三国 · 黄巾之乱（涿郡）割草肉鸽的网页原型。根目录 `index.html` 是完整可玩的单文件（菜单 → 开局配置 → 战斗 → 结算）。

- `src/script.js` 战斗逻辑；`src/build.py` 打包战斗页；`src/flow_build.py` 打包整套流程
- `src/menu2.html`、`src/cfg.html` 菜单与开局配置页
- `art/` 主角/黄巾图集与 UI 素材（战场地面、波斯/骑兵素材来自 cavalry-survivors 仓库）

注意：构建脚本里的路径指向原工作目录，需要按本机路径调整。
