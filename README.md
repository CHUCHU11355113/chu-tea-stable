# Chu Tea Stable

这是 Chu Tea 项目的**生产环境稳定版本仓库**。

## 说明

- 此仓库只接受来自 `chu-tea-dev` 仓库的代码合并
- 代码推送到 `main` 分支会自动触发部署到生产服务器
- **禁止**直接在此仓库进行开发工作

## 部署流程

1. 在 `chu-tea-dev` 完成开发和测试
2. 创建 PR 从 `chu-tea-dev` 合并到此仓库
3. 审核并合并 PR
4. GitHub Actions 自动部署到生产环境

## 回滚

如需回滚，请在 GitHub Actions 中重新运行上一个成功的部署任务。
