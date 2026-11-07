# 无名三国录：幸存者

三国 · 黄巾之乱（涿郡）割草肉鸽的网页原型。根目录 `index.html` 是完整可玩的单文件（菜单 → 开局配置 → 战斗 → 结算）。

- `src/script.js` 战斗逻辑；`src/build.py` 打包战斗页（输出 `build/greybox3.html`）；`src/flow_build.py` 打包整套流程（输出根目录 `index.html`）
- `src/menu/` 菜单、开局配置、结算页；`src/greybox.template.html` 战斗页外壳
- `art/` 主角图集（hero_art）、黄巾图集、UI 素材
- `assets/` 战场地面、道具、波斯/骑兵素材（来自 cavalry-survivors 仓库）

构建：在仓库根目录依次运行 `python3 src/build.py` 和 `python3 src/flow_build.py`，脚本用相对路径，不依赖本机目录。
注意：单文件 index.html 约 16MB，已接近 Claude 工件 16 MiB 的上限。
