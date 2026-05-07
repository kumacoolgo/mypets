# MyPets

MyPets 是一个可部署到 Zeabur 的网页版电子宠物 MVP。用户可以注册、登录、领养宠物、喂食、玩耍、睡觉、洗澡、打工，并使用 OpenAI Compatible API 生成 AI 探险、AI 游玩、AI 打工和随机事件剧情。管理员可以管理用户、宠物、注册开关和 AI 配置。

## 截图

当前仓库预留截图位置：`docs/screenshots/`。部署后建议补充首页、宠物页、管理员后台和 AI 设置页截图。

## 技术栈

- Next.js App Router、React、TypeScript、Tailwind CSS
- PostgreSQL、Prisma ORM
- bcryptjs 密码哈希、jose httpOnly cookie session
- Docker、docker-compose、GitHub Actions、GitHub Container Registry
- Zeabur Docker Image + Zeabur PostgreSQL

## 功能列表

- 首页、注册、登录、退出、`/api/auth/me`
- 宠物创建、状态显示、时间懒衰减、互动、升级、金币、互动日志
- 管理员自动初始化、后台统计、用户列表、宠物列表、系统设置
- 注册开关：数据库 `SystemSetting.allow_register` 优先，首次从 `ALLOW_REGISTER` 初始化
- AI 互动：OpenAI/OpenRouter/DeepSeek/Kimi/Groq/Together/Ollama/LM Studio 等兼容 `/v1/chat/completions`
- AI 后端强制校验奖励范围，失败时 fallback，不信任模型输出
- 健康检查：`GET /api/health`

## 本地开发

先准备 `.env`，可以从 `.env.example` 复制后修改。不要提交 `.env`。

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

本地开发默认访问 `http://localhost:3000`。

## Docker Compose

```bash
docker compose up -d --build
docker compose logs -f app
docker compose down
docker compose down -v
```

`docker compose down -v` 会彻底清空本地 PostgreSQL 数据卷。

## 环境变量

核心变量见 `.env.example`。生产环境必须修改：

- `ADMIN_PASSWORD`
- `SESSION_SECRET`，至少 32 位
- `APP_API_KEY`
- `AI_API_KEY`，如果启用 AI

`DATABASE_URL` 是 PostgreSQL 连接地址。Zeabur 部署时使用 Zeabur PostgreSQL 服务提供的连接地址。`DATA_DIR=/app/data` 预留给未来头像、素材、缓存等文件，Zeabur 可挂载持久化卷到这里。

## 数据库与 Prisma

固定使用 PostgreSQL，不使用 SQLite/MongoDB/MySQL。

```bash
npx prisma generate
npx prisma migrate dev
npm run prisma:deploy
npm run db:bootstrap
```

Docker 启动时会自动执行 `prisma migrate deploy` 和 `db:bootstrap`。

## 管理员初始化

启动脚本会检查数据库：如果不存在 `role=ADMIN` 的用户，会使用这些环境变量创建管理员：

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_EMAIL`

密码会用 bcryptjs 加密保存。已经存在管理员时不会重复创建。生产环境不要使用默认 `ADMIN_PASSWORD=change_me_please`。

## 注册开关

首次启动时，`allow_register` 从 `ALLOW_REGISTER` 初始化到数据库。后续以后台 `/admin/settings` 保存的数据库值为准。关闭后注册页会提示，`POST /api/auth/register` 也会拒绝普通注册。

## AI 配置

`.env.example` 已包含：

```bash
AI_ENABLED=false
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=change_me_ai_api_key
AI_MODEL=gpt-4o-mini
AI_TIMEOUT_SECONDS=30
AI_DAILY_LIMIT_PER_USER=20
AI_EVENT_COOLDOWN_SECONDS=60
```

启用方式：设置 `AI_ENABLED=true`，配置 `AI_BASE_URL`、`AI_API_KEY`、`AI_MODEL`，或登录管理员后台 `/admin/ai-settings` 修改。数据库设置优先于环境变量。API Key 不能使用 `NEXT_PUBLIC` 前缀，因为它只能在服务端读取。MVP 支持后台保存 API Key，但生产环境建议接入密钥管理或加密保存。

示例：

```bash
# OpenAI
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini

# OpenRouter
AI_BASE_URL=https://openrouter.ai/api/v1
AI_MODEL=openai/gpt-4o-mini

# DeepSeek
AI_BASE_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-chat

# Ollama
AI_BASE_URL=http://你的Ollama地址:11434/v1
AI_MODEL=gemma4:e4b
AI_API_KEY=ollama

# LM Studio
AI_BASE_URL=http://你的LMStudio地址:1234/v1
AI_MODEL=local-model
AI_API_KEY=lm-studio
```

Ollama 和 LM Studio 有些情况下不需要真实 API Key，但为了兼容 `Authorization: Bearer`，可以填写任意字符串。管理员后台可以点击“测试连接”。AI 调用失败或返回异常 JSON 时，会使用本地 fallback 事件，用户页面不会崩溃。每日限制和冷却时间通过 `AI_DAILY_LIMIT_PER_USER`、`AI_EVENT_COOLDOWN_SECONDS` 或后台设置控制。

## GitHub Actions 与 GHCR

push 到 `main` 会自动构建并推送镜像到 GitHub Container Registry：

- `ghcr.io/kumacoolgo/mypets:latest`
- `ghcr.io/kumacoolgo/mypets:${{ github.sha }}`

Pull Request 只构建不推送。可在 GitHub 仓库的 Packages 页面查看镜像。如果 GHCR package 是 private，Zeabur 拉取可能需要访问权限；建议把 package visibility 调成 public。

## Zeabur 部署

1. 确认 GitHub Actions 已成功构建镜像：`ghcr.io/kumacoolgo/mypets:latest`
2. 进入 Zeabur，新建 Project
3. 添加 PostgreSQL 服务
4. 添加 Docker Image 服务，镜像填写 `ghcr.io/kumacoolgo/mypets:latest`
5. 设置端口 `3000`
6. 设置环境变量：

```bash
DATABASE_URL=Zeabur PostgreSQL 提供的连接地址
ADMIN_USERNAME=admin
ADMIN_PASSWORD=请改成强密码
ADMIN_EMAIL=你的邮箱
APP_API_KEY=随机强字符串
SESSION_SECRET=随机强字符串，至少 32 位
ALLOW_REGISTER=true
NEXT_PUBLIC_APP_NAME=MyPets
DATA_DIR=/app/data
NODE_ENV=production
AI_ENABLED=false
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=你的 AI Key
AI_MODEL=gpt-4o-mini
AI_TIMEOUT_SECONDS=30
AI_DAILY_LIMIT_PER_USER=20
AI_EVENT_COOLDOWN_SECONDS=60
```

7. 添加持久化卷 `/app/data`
8. 部署完成后访问 Zeabur 域名
9. 访问 `/login` 使用管理员账号登录
10. 进入 `/admin`
11. 进入 `/admin/settings` 控制注册
12. 进入 `/admin/ai-settings` 配置和测试 AI

当前 MVP 主要数据在 PostgreSQL，`/app/data` 用于未来上传头像、宠物素材、缓存等。

## 常见问题

- 登录失败：确认 `SESSION_SECRET` 已配置，数据库迁移和 bootstrap 成功。
- 管理员未创建：查看 `docker compose logs -f app`，确认 `DATABASE_URL` 可连接。
- AI 未显示：确认 `AI_ENABLED=true` 且 `AI_API_KEY` 已配置。
- Zeabur 拉不到 GHCR 镜像：把 GitHub Packages visibility 改为 public，或配置访问权限。

## 安全提醒

- 生产环境不要使用默认 `ADMIN_PASSWORD`
- 生产环境必须修改 `SESSION_SECRET`
- 生产环境必须修改 `APP_API_KEY`
- 不要提交 `.env`
- Docker 镜像不会包含 `.env`
- 普通用户不能访问其他用户宠物或 AI 配置
- AI 只生成剧情和建议奖励，最终经验、金币、等级、状态变化都由后端校验、限制并写入数据库

## 许可证与参考灵感

项目代码为原创实现。玩法参考了 virtual pet、Tamagotchi、desktop pet、pet simulator、AI pet 等常见电子宠物概念。默认宠物形象使用 emoji 和 CSS，无第三方图片、音频、模型素材。

本仓库使用 MIT License，见 `LICENSE`。
