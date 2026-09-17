# 产品经理工作台

产品经理工作台桌面应用源码，包含桌面前端与 Rust 后端，以及当前模型对比功能。

## 项目结构

- `AionUi/`：桌面端与前端源码、资源、测试及构建脚本。
- `AionCore/`：Rust 后端工作区、接口与服务实现。
- `打包说明.md`：源码快照范围与排除项。
- `FILES.sha256`：源码快照文件校验清单。

## 开发与构建

请保留 AionUi 与 AionCore 的同级目录结构。安装依赖与构建说明见 [AionUi 文档](AionUi/readme.md)、[前端脚本](AionUi/package.json)、[后端架构](AionCore/ARCHITECTURE.zh-CN.md) 及各自的 justfile。

本仓库不包含已安装依赖、编译缓存、桌面安装包和个人运行数据。此次发布为工作区源码快照，文件完整性已校验，未重新执行构建与功能测试。

## 许可证

保留上游项目许可证及版权声明，详见 [AionUi/LICENSE](AionUi/LICENSE) 和 [AionCore/LICENSE](AionCore/LICENSE)。
