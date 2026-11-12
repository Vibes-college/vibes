-- SPDX-License-Identifier: AGPL-3.0-only
-- 搬数据：社区账号注册表里的词汇线进度（scope client/lojo/english，key vocab）→ app_vocab.progress。
-- 用数据库管理员跑一次（小程序自己的账号读不到社区的表）；表由小程序第一次启动时建好，所以先上线再跑。
-- 重复跑不会重复：已经有的人跳过（小程序里的更新）。社区那边的旧数据不删（删要创始人点头）。
-- 旧数据没有逐个词的记录，answers 表从搬家后开始记。
--   docker compose exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -f - < source/miniapps/vocab/import-from-community.sql
BEGIN;
INSERT INTO app_vocab.progress (user_id, value, updated_at)
SELECT r."userId", r."value", r."updatedAt"
FROM public.registry_item r
WHERE r."key" = 'vocab' AND r."scope" = ARRAY['client','lojo','english']::varchar[] AND r."domain" IS NULL
  AND jsonb_typeof(r."value") = 'object'
ON CONFLICT (user_id) DO NOTHING;
SELECT count(*) AS "搬过来的人数" FROM app_vocab.progress;
COMMIT;
