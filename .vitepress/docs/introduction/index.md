# 概要

> 基于react + cra 来构造 electron 应用程序的样板代码.

该项目的目的，是为了要避免使用 react 手动建立起 electron 应用程序。electron-react 充分利用 creat-react-app 作为脚手架工具，
加上拥有 creat-react-app 的 webpack, 生产编译即更新的 electron-builder，以及一些最常用的插件，如react-router-dom、redux、redux-saga 等等。

<div style="background-color: #e9eaff; padding: 10px; border-radius: 5px;">
  只是想尝试一下，<a href="/docs/getting-started/">快速开始</a>
</div>

## 内置模块

* 基本的项目结构与 单一的 package.json 设置
* 详细的 <a href="/electron-react/docs/getting-started/">文档</a> 
* 使用<a href="https://create-react-app.dev/docs/getting-started" target='blank'>create-react-app </a>作为web端基础脚手架
* 内置基础的 <a href="https://redux.js.org/" target='blank'> redux </a> 状态机，
  <a href="https://redux-saga.js.org/" target='blank'> redux-saga  </a>异步工具库，
  <a href="https://reactrouter.com/en/main" target='blank'> react-router </a>导航库
* 基本的项目结构与 单一的 package.json 设置
* 使用 <a href="https://www.electron.build/index.html" target='blank'> electron-builder </a> 轻松打包和分发你的应用程序
* build-and-release.yml 配置用于 electron-builder 的自动部署
* 使用携带模块热更新 (Hot Module Replacement) 的 craco.config
