-- SPDX-License-Identifier: AGPL-3.0-only
-- 搬数据：社区的 lojo_word / lojo_word_card / lojo_word_review → app_wordbook.word / card / review，id 和每一列原样搬。
-- 用数据库管理员跑一次（小程序自己的账号读不到社区的表）。重复跑不会重复：id 已经有的跳过。
-- 社区那边的旧表不删（删要创始人点头）。搬的时候要先停写：社区已经改成转给小程序以后再跑，旧表就不会再有新词。
--   docker compose exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -f - < miniapps/wordbook/import-from-community.sql
BEGIN;
INSERT INTO app_wordbook.word (id, "userId", key, text, kind, meaning, usage, example, "exampleZh", source, "noteId", "createdAt")
SELECT id, "userId", key, text, kind, meaning, usage, example, "exampleZh", source, "noteId", "createdAt" FROM public.lojo_word
ON CONFLICT DO NOTHING;
INSERT INTO app_wordbook.card (id, "wordId", "userId", kind, due, stability, difficulty, "elapsedDays", "scheduledDays", "learningSteps", reps, lapses, state, "lastReview")
SELECT c.id, c."wordId", c."userId", c.kind, c.due, c.stability, c.difficulty, c."elapsedDays", c."scheduledDays", c."learningSteps", c.reps, c.lapses, c.state, c."lastReview"
FROM public.lojo_word_card c WHERE EXISTS (SELECT 1 FROM app_wordbook.word w WHERE w.id = c."wordId")
ON CONFLICT DO NOTHING;
INSERT INTO app_wordbook.review (id, "cardId", "userId", rating, state, due, stability, difficulty, "elapsedDays", "lastElapsedDays", "scheduledDays", "learningSteps", "reviewedAt", "durationMs")
SELECT v.id, v."cardId", v."userId", v.rating, v.state, v.due, v.stability, v.difficulty, v."elapsedDays", v."lastElapsedDays", v."scheduledDays", v."learningSteps", v."reviewedAt", v."durationMs"
FROM public.lojo_word_review v WHERE EXISTS (SELECT 1 FROM app_wordbook.card c WHERE c.id = v."cardId")
ON CONFLICT DO NOTHING;
SELECT (SELECT count(*) FROM app_wordbook.word) AS "词", (SELECT count(*) FROM app_wordbook.card) AS "卡", (SELECT count(*) FROM app_wordbook.review) AS "复习记录";
COMMIT;
